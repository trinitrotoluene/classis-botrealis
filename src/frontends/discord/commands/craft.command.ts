import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { QueryBus } from "@src/framework";
import SearchItemsQuery from "@src/application/queries/bitcraft/SearchItemsQuery";
import GetItemRecipeQuery, {
  type IRecipeNode,
} from "@src/application/queries/bitcraft/GetItemRecipeQuery";
import GetClaimStallPocketsQuery from "@src/application/queries/bitcraft/GetClaimStallPocketsQuery";
import GetServerConfigQuery from "@src/application/queries/config/GetServerConfigQuery";

export const data = new SlashCommandBuilder()
  .setName("craft")
  .setDescription("Commands related to settlement crafting projects")
  .addSubcommand((s) =>
    s
      .setName("check")
      .setDescription(
        "See if you can make something using items currently deposited in your claim's barter stalls"
      )
      .addStringOption((s) =>
        s
          .setName("item")
          .setDescription("The item to search")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addNumberOption((s) =>
        s
          .setName("quantity")
          .setDescription(
            "The amount of this item you want to craft - defaults to 1"
          )
      )
      .addNumberOption((s) =>
        s
          .setName("depth")
          .setDescription("How many items deep should the recipe be rendered?")
      )
      .addNumberOption((s) =>
        s
          .setName("tier")
          .setDescription(
            "Set this option if you want to filter a recipe to only show a specific tier of items required"
          )
      )
      .addStringOption((s) =>
        s
          .setName("item_name")
          .setDescription(
            "Only show recipe ingredients matching the provided regular expression"
          )
      )
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("check", {
  async autocomplete(i) {
    const queryText = i.options.getFocused();
    const result = await QueryBus.execute(
      new SearchItemsQuery({
        name: queryText,
        hasCompendiumEntry: true,
      })
    );

    if (result.ok) {
      await i.respond(
        result.data.results
          .slice(0, 25)
          .sort((a, b) => a.tier - b.tier)
          .map((item) => ({
            name: `[T${item.tier}] ${item.name} - ${item.rarity}`,
            value: item.id,
          }))
      );
    }
  },
  async execute(i) {
    const itemOption = i.options.get("item");
    if (!itemOption) {
      throw new Error("missing item option");
    }

    const quantity = i.options.getNumber("quantity", false) ?? 1;
    const depth = i.options.getNumber("depth", false) ?? 5;
    const tierFilter = i.options.getNumber("tier", false);
    const itemName = i.options.getString("item_name", false);

    const { value } = itemOption;

    const itemId = parseInt(value?.toString() ?? "");

    const recipeResult = await QueryBus.execute(
      new GetItemRecipeQuery({ itemId: itemId, quantity: quantity })
    );

    const serverConfigResult = await QueryBus.execute(
      new GetServerConfigQuery({ serverId: i.guildId ?? "0" })
    );

    const inventoryResult = await QueryBus.execute(
      new GetClaimStallPocketsQuery({
        claimId: serverConfigResult.ok
          ? (serverConfigResult.data.linkedClaimId ?? "0")
          : "0",
      })
    );

    if (!recipeResult.ok || !inventoryResult.ok) {
      await i.reply({
        content: "Sorry, something went wrong executing this command",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const recipeTreeLines: string[] = [];
    renderRecipeTree(
      recipeTreeLines,
      recipeResult.data.recipe,
      inventoryResult.data,
      {
        tier: tierFilter ?? undefined,
        itemName: itemName ? new RegExp(itemName) : undefined,
      },
      depth
    );

    const builder = new ContainerBuilder()
      .setAccentColor(0xd9427e)
      .addTextDisplayComponents((c) =>
        c.setContent(
          `## ${recipeResult.data ? `[T${recipeResult.data.recipe.item?.tier}] ${recipeResult.data.recipe.item?.name}` : "n/a"}`
        )
      )
      .addTextDisplayComponents((c) =>
        c.setContent(
          `-# Crafting ${recipeResult.data.recipe.quantity} of this item`
        )
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(["```", ...recipeTreeLines, "```"].join("\n"))
      );

    await i.reply({
      components: [builder],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
});

interface ILensOptions {
  tier?: number;
  itemName?: RegExp;
}

function renderRecipeTree(
  builder: string[],
  recipe: IRecipeNode,
  inventoryMap: Map<number, number>,
  lens: ILensOptions,
  maxDepth = 5,
  depth = 0,
  indent = ""
) {
  if (depth > maxDepth) {
    return;
  }

  let hide = false;

  if (lens.tier !== undefined && lens.tier !== recipe.item?.tier) {
    hide = true;
  }

  if (
    lens.itemName !== undefined &&
    lens.itemName.test(recipe.item?.name ?? "")
  ) {
    hide = true;
  }

  if (!hide) {
    builder.push(
      `${indent}T${recipe.item?.tier} ${recipe.item?.name} ${inventoryMap.get(recipe.itemId) ?? "0"}/${recipe.quantity}`
    );
  }

  const firstChildRecipe = recipe.recipes[Object.keys(recipe.recipes)[0]];
  if (firstChildRecipe == undefined) {
    return;
  }

  for (const childRecipeNode of firstChildRecipe) {
    renderRecipeTree(
      builder,
      childRecipeNode,
      inventoryMap,
      lens,
      maxDepth,
      hide ? depth : depth + 1,
      indent + (hide ? "" : "  ")
    );
  }
}
