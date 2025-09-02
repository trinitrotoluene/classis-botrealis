import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { QueryBus } from "@src/framework";
import SearchItemsQuery from "@src/application/queries/bitcraft/SearchItemsQuery";
import GetPriceInformationQuery from "@src/application/queries/bitcraft/GetPriceInformationQuery";
import GetItemQuery from "@src/application/queries/bitcraft/GetItemQuery";

export const data = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Get pricing information for bitcraft items")
  .addSubcommand((s) =>
    s
      .setName("check")
      .setDescription("Get a price check on a bitcraft item")
      .addStringOption((s) =>
        s
          .setName("item")
          .setDescription("The item to search")
          .setAutocomplete(true)
          .setRequired(true),
      ),
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
      }),
    );

    if (result.ok) {
      await i.respond(
        result.data.results
          .slice(0, 25)
          .sort((a, b) => a.tier - b.tier)
          .map((item) => ({
            name: `[T${item.tier}] ${item.name} - ${item.rarity}`,
            value: item.id,
          })),
      );
    }
  },
  async execute(i) {
    const itemOption = i.options.get("item");
    if (!itemOption) {
      throw new Error("missing item option");
    }

    const { value } = itemOption;
    const itemId = value?.toString() ?? "";
    const itemResult = await QueryBus.execute(new GetItemQuery({ id: itemId }));
    const priceResult = await QueryBus.execute(
      new GetPriceInformationQuery({ id: itemId }),
    );

    if (!priceResult.ok || !itemResult.ok) {
      await i.reply({
        content:
          "Sorry, I wasn't able to to get price information for this item",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { buy, sell } = priceResult.data;

    const builder = new ContainerBuilder()
      .setAccentColor(0xd9427e)
      .addTextDisplayComponents((c) =>
        c.setContent(
          `## ${itemResult.data ? `[T${itemResult.data.tier}] ${itemResult.data.name} - ${itemResult.data.rarity}` : "n/a"}`,
        ),
      )
      .addTextDisplayComponents((c) =>
        c.setContent(`-# ${itemResult.data?.description ?? "n/a"}`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          [
            `### Buys`,
            "```",
            `Adj. avg. price : ${buy?.adjustedWeightedAveragePrice ?? "n/a"}`,
            `Highest price   : ${buy?.highestPrice ?? "n/a"}`,
            `Lowest price    : ${buy?.lowestPrice ?? "n/a"}`,
            "```",
          ].join("\n"),
        ),
      )
      .addTextDisplayComponents((t) =>
        t.setContent(
          [
            `### Sells`,
            "```",
            `Adj. avg. price : ${sell?.adjustedWeightedAveragePrice ?? "n/a"}`,
            `Highest price   : ${sell?.highestPrice ?? "n/a"}`,
            `Lowest price    : ${sell?.lowestPrice ?? "n/a"}`,
            "```",
          ].join("\n"),
        ),
      );

    await i.reply({
      components: [builder],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
