import { SlashCommandBuilder } from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { QueryBus } from "@src/framework";
import GetItemListQuery from "@src/application/queries/bitcraft/GetItemListQuery";
import SearchItemListsQuery from "@src/application/queries/bitcraft/SearchItemListsQuery";

export const data = new SlashCommandBuilder()
  .setName("itemlist")
  .setDescription("Inspect a bitcraft item list")
  .addSubcommand((s) =>
    s
      .setName("possibilities")
      .setDescription("Displays the possibilities of an item list")
      .addStringOption((s) =>
        s
          .setName("name")
          .setDescription("The name of the item list to search")
          .setAutocomplete(true)
          .setRequired(true),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("possibilities", {
  async autocomplete(i) {
    const name = i.options.getString("name", true);
    const getItemListResponse = await QueryBus.execute(
      new SearchItemListsQuery({ searchString: name }),
    );

    if (!getItemListResponse.ok) {
      throw new Error(`Unable to get item list ${name}`);
    }

    await i.respond(
      getItemListResponse.data
        .map((x) => ({
          name: x.name,
          value: x.id,
        }))
        .slice(0, 25),
    );
  },
  async execute(i) {
    const name = i.options.getString("name", true);
    const itemListResponse = await QueryBus.execute(
      new GetItemListQuery({ id: name }),
    );

    if (!itemListResponse.ok) {
      throw new Error(`Unable to get item list ${name}`);
    }

    const itemList = itemListResponse.data;
    const totalProbability = itemList.possibilities.reduce(
      (acc, x) => acc + x.probability,
      0,
    );

    const output: string[] = [];
    for (const possibility of itemList.possibilities) {
      const itemList = possibility.items
        .map((x) => `T${x.tier} ${x.name} (x${x.quantity}) - ${x.rarity}`)
        .join(", ");

      const probability = (
        (possibility.probability / totalProbability) *
        100
      ).toFixed(4);

      output.push(`${probability}% ${itemList}`);
    }

    await i.reply({
      content: `## ${itemList.name}\n\n\`\`\`${output.join("\n")}\`\`\``,
    });
  },
});
