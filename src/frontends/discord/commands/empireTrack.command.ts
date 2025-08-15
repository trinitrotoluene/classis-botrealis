import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { CommandBus, QueryBus } from "@src/framework";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import GetEmpiresQuery from "@src/application/queries/bitcraft/GetEmpiresQuery";
import ServerFeature from "@src/database/__generated__/public/ServerFeature";

export const requiredPermissions = PermissionFlagsBits.ManageMessages;
export const requiredFeatures = [ServerFeature.observe_empires];

export const data = new SlashCommandBuilder()
  .setName("empire-track")
  .setDefaultMemberPermissions(requiredPermissions)
  .setDescription("Log empire updates to a thread")
  .addSubcommand((s) =>
    s
      .setName("start")
      .setDescription(
        "Create a thread logging empire updates in the channel you run this command in"
      )
  )
  .addSubcommand((s) =>
    s.setName("stop").setDescription("Stop notifying for empire updates")
  )
  .addSubcommand((s) =>
    s
      .setName("watch")
      .setDescription("Add an empire to your watching list")
      .addStringOption((o) =>
        o
          .setName("empire")
          .setDescription("The name of the target empire")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand((s) =>
    s
      .setName("unwatch")
      .setDescription("Remove an empire from your watching list")
      .addStringOption((o) =>
        o
          .setName("empire")
          .setDescription("The name of the target empire")
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("start", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = i.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Unsupported channel type",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const thread = await channel.threads.create({
      name: "[auto] Empire observation",
      reason:
        "This thread automatically tracks updates to empires on our watch list",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        observingEmpireLogsThreadId: thread.id,
      })
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to configure empire observation due to an internal error. The thread may have been created, but it will not receive notifications.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: "Thread created!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("stop", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = i.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Unsupported channel type",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        observingEmpireLogsThreadId: null,
      })
    );

    if (result.ok) {
      await i.reply({
        content: `Empire observation logging stopped`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content:
          "Sorry, I ran into an issue - if it persists, you can delete the thread manually as a workaround.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("watch", {
  async autocomplete(i) {
    const empire = i.options.getString("empire");
    const searchResult = await QueryBus.execute(
      new GetEmpiresQuery({ searchText: empire ?? "" })
    );

    await i.respond(
      searchResult.ok
        ? [
            { name: "*", value: "*" },
            ...searchResult.data.results.map((x) => ({
              name: x.name,
              value: x.id,
            })),
          ]
        : []
    );
  },
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = i.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Unsupported channel type",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const empire = i.options.getString("empire", true);

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        addObservedEmpires: empire ? [empire] : undefined,
      })
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to add ${empire} to your watch list.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Now watching empire ID ${empire}!`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});

registerSubCommand("unwatch", {
  async autocomplete(i) {
    const empire = i.options.getString("empire");
    const searchResult = await QueryBus.execute(
      new GetEmpiresQuery({ searchText: empire ?? "" })
    );

    await i.respond(
      searchResult.ok
        ? [
            { name: "*", value: "*" },
            ...searchResult.data.results.map((x) => ({
              name: x.name,
              value: x.id,
            })),
          ]
        : []
    );
  },
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = i.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Unsupported channel type",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const empire = i.options.getString("empire", true);

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        removeObservedEmpires: empire ? [empire] : undefined,
      })
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to remove ${empire} from your watch list.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `No longer watching empire ID ${empire}!`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
