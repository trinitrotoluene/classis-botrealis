import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import ServerFeature from "@src/database/__generated__/public/ServerFeature";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import { CommandBus } from "@src/framework";

export const isAdminGuildOnly = true;

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Application management commands")
  .addSubcommand((s) =>
    s
      .setName("feature")
      .setDescription("Enable a restricted feature for a server")
      .addStringOption((o) =>
        o
          .setName("server")
          .setDescription("The server to enable the feature in")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((o) =>
        o
          .setName("grant")
          .setDescription("The key of the feature to enable")
          .setAutocomplete(true),
      )
      .addStringOption((o) =>
        o
          .setName("revoke")
          .setDescription("The key of the feature to enable")
          .setAutocomplete(true),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("feature", {
  async autocomplete(i) {
    const option = i.options.getFocused(true);

    switch (option.name) {
      case "server":
        await i.respond(
          i.client.guilds.cache
            .values()
            .filter((x) =>
              x.name.toLowerCase().includes(option.value.toLowerCase()),
            )
            .map((x) => ({
              name: x.name,
              value: x.id,
            }))
            .toArray(),
        );
        return;
      case "grant":
      case "revoke":
        await i.respond(
          Object.values(ServerFeature).map((x) => ({ name: x, value: x })),
        );
        return;
    }
  },
  async execute(i) {
    const grant = i.options.getString("grant") as ServerFeature | undefined;
    const revoke = i.options.getString("revoke") as ServerFeature | undefined;

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.options.getString("server", true),
        addFeatures: grant ? [grant] : undefined,
        removeFeatures: revoke ? [revoke] : undefined,
      }),
    );

    if (!result.ok) {
      await i.reply({
        content: "Encountered an error updating server features",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: "Updated server features successfully",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
