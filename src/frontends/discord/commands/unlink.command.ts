import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import GetLinkedInventoriesQuery from "@src/application/queries/config/GetLinkedInventoriesQuery";
import { CommandBus, QueryBus } from "@src/framework";
import DeleteInventoryLinkCommand from "@src/application/commands/config/DeleteInventoryLinkCommand";
import GetAllLinkedBitcraftAccountsQuery from "@src/application/queries/config/GetAllLinkedBitcraftAccountsQuery";
import DeleteUserLinkCommand from "@src/application/commands/config/DeleteUserLinkCommand";

export const data = new SlashCommandBuilder()
  .setName("unlink")
  .setDescription("Remove linking between Discord and Bitcraft")
  .addSubcommand((s) =>
    s
      .setName("player")
      .setDescription(
        "Remove a link between your Discord and Bitcraft accounts",
      )
      .addStringOption((o) =>
        o
          .setName("user")
          .setAutocomplete(true)
          .setRequired(true)
          .setDescription(
            "The bitcraft user to remove from your Discord account - use /link view-players to see linked accounts",
          ),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("inventory")
      .setDescription("Stop tracking a Bitcraft inventory")
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

registerSubCommand("inventory", {
  requiredPermissions: PermissionFlagsBits.ManageMessages,
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
        value: x.trackedInventoryId,
      })),
    );
  },
  async execute(i) {
    const trackedInventoryId = i.options.getString("inventory", true);
    const result = await CommandBus.execute(
      new DeleteInventoryLinkCommand({ id: trackedInventoryId }),
    );

    if (!result.ok) {
      throw new Error("Failed to delete inventory link");
    }

    await i.reply({
      content: `No longer tracking this inventory.`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

registerSubCommand("player", {
  async autocomplete(i) {
    const linkedAccountsResponse = await QueryBus.execute(
      new GetAllLinkedBitcraftAccountsQuery({ discordUserId: i.user.id }),
    );

    if (!linkedAccountsResponse.ok) {
      i.respond([]);
      return;
    }

    await i.respond(
      linkedAccountsResponse.data.map((x) => ({
        name: x.username,
        value: x.id,
      })),
    );
  },
  async execute(i) {
    const bitcraftUserId = i.options.getString("user", true);
    const result = await CommandBus.execute(
      new DeleteUserLinkCommand({
        id: bitcraftUserId,
        discordUserId: i.user.id,
      }),
    );

    if (!result.ok) {
      throw new Error("Failed to delete user link");
    }

    await i.reply({
      content: `Link removed! You can re-link your account at any time using /link.`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
