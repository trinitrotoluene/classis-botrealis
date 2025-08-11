import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { CommandBus } from "@src/framework";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";

export const requiredPermissions = PermissionFlagsBits.ManageMessages;

export const data = new SlashCommandBuilder()
  .setName("sharedcrafts")
  .setDefaultMemberPermissions(requiredPermissions)
  .setDescription("Manage the shared crafting notifier for your server")
  .addSubcommand((s) =>
    s
      .setName("start")
      .setDescription(
        "Create a thread logging shared crafts in the channel you run this command in"
      )
  )
  .addSubcommand((s) =>
    s.setName("stop").setDescription("Stop notifying for shared crafts")
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
      name: "[auto] Shared craft notifications",
      reason:
        "This thread automatically tracks shared crafts as they are created",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        sharedCraftThreadId: thread.id,
      })
    );

    if (!result.ok) {
      await i.reply({
        content: `Sorry, I wasn't able to configure live chat forwarding due to an internal error. The thread may have been created, but it will not receive notifications.`,
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
        sharedCraftThreadId: null,
      })
    );

    if (result.ok) {
      await i.reply({
        content: `Live shared crafts notifications stopped`,
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
