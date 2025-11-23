import {
  MessageFlags,
  SlashCommandBuilder,
  PermissionFlagsBits,
  channelMention,
} from "discord.js";
import { CommandBus, QueryBus } from "@src/framework";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import { commandDefinition } from "./sdk/CommandBuilder";
import SearchClaimsQuery from "@src/application/queries/bitcraft/SearchClaimsQuery";
import AddSupplyAlertCommand from "@src/application/commands/config/AddSupplyAlertCommand";
import DeleteSupplyAlertCommand from "@src/application/commands/config/DeleteSupplyAlertCommand";
import GetSupplyAlertsQuery from "@src/application/queries/config/GetSupplyAlertsQuery";
import ServerFeature from "@src/database/__generated__/public/ServerFeature";

export const requiredPermissions = PermissionFlagsBits.Administrator;
export const requiredFeatures = [ServerFeature.supply_alerts];

export const data = new SlashCommandBuilder()
  .setName("supply-alerts")
  .setDescription("Manage supply alerts in your server")
  .setDefaultMemberPermissions(requiredPermissions)
  .addSubcommand((s) =>
    s
      .setName("start")
      .setDescription("Set the channel to send supply alerts to")
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("The channel to send supply alerts to")
          .setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s.setName("stop").setDescription("Turn off supply alerts"),
  )
  .addSubcommand((s) =>
    s
      .setName("add")
      .setDescription(
        "Watch the supply levels of a claim, notifying you when they fall below the provided threshold",
      )
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("The name of the claim to watch")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addNumberOption((o) =>
        o
          .setName("threshold")
          .setDescription("The supply threshold to notify at")
          .setRequired(true)
          .setMinValue(0),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("remove")
      .setDescription("Stop receiving supply alerts for a claim")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("The name of the claim to stop watching")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("view")
      .setDescription("Display the current supply alerts set for the server"),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("start", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const channelId = i.options.getChannel("channel", true).id;

    const result = await QueryBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        supplyAlertChannelId: channelId,
      }),
    );
    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to set the supply alerts channel due to an internal error.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Supply alerts will be sent to ${channelMention(channelId)}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("stop", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }
    const result = await QueryBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        supplyAlertChannelId: null,
      }),
    );
    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to unset the supply alerts channel due to an internal error.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Supply alerts channel unset.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("add", {
  async autocomplete(i) {
    const claimName = i.options.getString("name") ?? "";
    const result = await QueryBus.execute(
      new SearchClaimsQuery({
        claimName: claimName,
      }),
    );

    if (result.ok) {
      i.respond(
        result.data.results
          .map((x) => ({
            name: x.name,
            value: x.entityId,
          }))
          .slice(0, 25),
      );
    }
  },
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const claimId = i.options.getString("name", true);
    const supplyThreshold = i.options.getNumber("threshold", true);

    const result = await CommandBus.execute(
      new AddSupplyAlertCommand({
        discordServerId: i.guildId,
        claimId,
        supplyThreshold,
      }),
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to add the supply alert due to an internal error.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Supply alert added for claim with ID ${claimId} at threshold ${supplyThreshold}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("remove", {
  async autocomplete(i) {
    if (!i.guildId) {
      return;
    }

    const result = await QueryBus.execute(
      new GetSupplyAlertsQuery({ discordServerId: i.guildId }),
    );

    if (result.ok) {
      i.respond(
        result.data.map((alert) => ({
          name: alert.name ?? alert.claimId,
          value: alert.claimId,
        })),
      );
    }
  },
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const claimId = i.options.getString("name", true);

    const result = await CommandBus.execute(
      new DeleteSupplyAlertCommand({
        discordServerId: i.guildId,
        claimId,
      }),
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to remove the supply alert due to an internal error.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Supply alert removed for claim with ID ${claimId}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("view", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await QueryBus.execute(
      new GetSupplyAlertsQuery({ discordServerId: i.guildId }),
    );

    if (!result.ok || result.data.length === 0) {
      await i.reply({
        content: "No supply alerts are currently set for this server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const tableHeader = `| Claim Name           | Threshold |
|----------------------|-----------|`;
    const tableRows = result.data
      .map(
        (alert) =>
          `| ${alert.name?.padEnd(20) ?? alert.claimId.padEnd(20)} | ${alert.supplyThreshold.toString().padStart(9)} |`,
      )
      .join("\n");

    const table = `\`\`\`
${tableHeader}
${tableRows}
\`\`\``;

    await i.reply({
      content: table,
      flags: MessageFlags.Ephemeral,
    });
  },
});
