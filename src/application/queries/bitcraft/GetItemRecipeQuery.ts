import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase, type IBitcraftRecipe } from "@src/framework";
import NodeCache from "node-cache";

interface Args {
  itemId: number;
  quantity: number;
}

interface Response {
  recipe?: IRecipeNode;
}

interface IRecipeNode {
  itemId: number;
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
  itemId: number,
  quantity: number
): Promise<IRecipeNode> {
  const cacheEntry = RecipeNodeCache.get(`${itemId}-${quantity}`) as
    | IRecipeNode
    | undefined;
  if (cacheEntry) {
    return cacheEntry;
  }

  const item = await getItem(itemId.toString());
  const recipes = await getAllRecipesProducing(itemId);

  const recipePicker: IRecipeNode["recipePicker"] = {};
  const recipeOptions: IRecipeNode["recipes"] = {};

  for (const recipe of recipes) {
    const consumedItems =
      recipe.consumed_item_stacks as IBitcraftRecipe["consumedItemStacks"];

    const nodesForConsumedItems = await Promise.all(
      consumedItems.map((x) => getRecipeNodes(x.itemId, x.quantity * quantity))
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

function getAllRecipesProducing(itemId: number) {
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
