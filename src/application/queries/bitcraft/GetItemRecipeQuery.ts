import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";
import type { BitcraftRecipe } from "@src/vela";
import NodeCache from "node-cache";

interface Args {
  itemId: string;
  quantity: number;
}

interface Response {
  recipe?: IRecipeNode;
}

export interface IRecipeNode {
  itemId: string;
  item?: {
    name: string;
    tier: number;
  };
  quantity: number;
  recipePicker: Record<string, string>;
  recipes: Record<string, IRecipeNode[]>;
}

const RecipeNodeCache = new NodeCache({
  stdTTL: 6 * 60 * 60,
});

export default class GetItemRecipeQuery extends CommandBase<Args, Response> {
  async execute() {
    return {
      recipe: await getRecipeNodes(this.args.itemId, this.args.quantity),
    };
  }
}

async function getRecipeNodes(
  itemId: string,
  quantity: number,
  visited = new Set<string>()
): Promise<IRecipeNode> {
  const cacheEntry = RecipeNodeCache.get(`${itemId}-${quantity}`) as
    | IRecipeNode
    | undefined;
  if (cacheEntry) {
    return cacheEntry;
  }

  if (itemId === undefined) {
    logger.warn(`getRecipeNodes called with undefined itemId`);
    return {
      itemId: itemId,
      item: undefined,
      quantity,
      recipePicker: {},
      recipes: {},
    };
  }

  if (visited.has(itemId)) {
    logger.warn(`Cycle detected for item ${itemId}`);
    return {
      itemId: itemId,
      item: undefined,
      quantity,
      recipePicker: {},
      recipes: {},
    };
  }

  const item = await getItem(itemId.toString());
  const recipes = await getAllRecipesProducing(itemId);

  const recipePicker: IRecipeNode["recipePicker"] = {};
  const recipeOptions: IRecipeNode["recipes"] = {};

  visited.add(itemId);

  for (const recipe of recipes) {
    const consumedItems =
      recipe.consumed_item_stacks as BitcraftRecipe["ConsumedItemStacks"];

    const nodesForConsumedItems = await Promise.all(
      consumedItems.map((x) =>
        getRecipeNodes(x.ItemId, x.Quantity * quantity, new Set(visited))
      )
    );

    const firstConsumedItemName = nodesForConsumedItems[0]?.item?.name ?? "n/a";
    const recipeName = recipe.name
      .replace("{0}", firstConsumedItemName)
      .replace("{1}", item?.name ?? "n/a");

    recipePicker[recipeName] = recipe.id;
    recipeOptions[recipe.id] = nodesForConsumedItems;
  }

  const entry = {
    itemId,
    item: item
      ? {
          name: item.name,
          tier: item.tier,
        }
      : undefined,
    quantity,
    recipePicker: recipePicker,
    recipes: recipeOptions,
  };

  RecipeNodeCache.set(`${itemId}-${quantity}`, entry);
  return entry;
}

function getAllRecipesProducing(itemId: string) {
  return db
    .selectFrom("recipes")
    .selectAll()
    .where("produced_item_stacks", "@>", `[{"itemId": ${itemId}}]`)
    .execute();
}

function getItem(itemId: string) {
  return db
    .selectFrom("items")
    .selectAll()
    .where("id", "=", itemId as ItemsId)
    .executeTakeFirst();
}
