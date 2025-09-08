import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { QueryBus } from "@src/framework";
import GetLinkedInventoriesQuery from "@src/application/queries/config/GetLinkedInventoriesQuery";
import GetContributionsToInventoryQuery from "@src/application/queries/config/GetContributionsToInventoryQuery";
import GetItemQuery from "@src/application/queries/bitcraft/GetItemQuery";

export const data = new SlashCommandBuilder()
  .setName("contribution")
  .setDescription("Check the data of an active contribution session")
  .addSubcommand((s) =>
    s
      .setName("summary")
      .setDescription("Get the summary of an active contribution session")
      .addStringOption((s) =>
        s
          .setName("inventory")
          .setDescription("The name of the inventory to summarise")
          .setAutocomplete(true)
          .setRequired(true),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("summary", {
  async autocomplete(i) {
    if (!i.inGuild()) {
      i.respond([]);
      return;
    }

    const inventories = await QueryBus.execute(
      new GetLinkedInventoriesQuery({ serverId: i.guildId }),
    );

    if (!inventories.ok) {
      throw new Error("Unable to fetch linked inventories");
    }

    await i.respond(
      inventories.data.map((x) => ({
        name: x.inventoryDisplayName,
        value: x.contributionSessionId,
      })),
    );
  },
  async execute(i) {
    const contributionSessionId = i.options.getString("inventory", true);
    const contributionResponse = await QueryBus.execute(
      new GetContributionsToInventoryQuery({ contributionSessionId }),
    );

    if (!contributionResponse.ok) {
      await i.reply({
        content: `Sorry, something went wrong fetching the contribution data for that inventory`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { contributionsByPlayer } = contributionResponse.data;

    const contributionsDisplay: string[] = [];

    for (const [, contributions] of contributionsByPlayer.entries()) {
      const playerDisplayLines: string[] = [];
      for (const [itemId, data] of contributions.entries()) {
        const itemInfo = await QueryBus.execute(
          new GetItemQuery({ id: itemId }),
        );
        playerDisplayLines.push(
          `${data.playerName ?? data.playerId} ➡️ ${itemInfo.ok ? itemInfo.data?.name : itemId} ${data.netContribution}`,
        );
      }
      contributionsDisplay.push(playerDisplayLines.join("\n"));
    }

    const container = new ContainerBuilder().addTextDisplayComponents((c) =>
      c.setContent(
        `## Contribution summary\n\n${contributionsDisplay.join("\n\n")}`,
      ),
    );

    await i.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
