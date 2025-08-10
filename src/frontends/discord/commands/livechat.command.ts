import {
  channelMention,
  ChannelType,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { CommandBus, QueryBus } from "@src/framework";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import GetServerConfigQuery from "@src/application/queries/config/GetServerConfigQuery";

export const data = new SlashCommandBuilder()
  .setName("livechat")
  .setDescription("Manage the live chat settings for your server")
  .addSubcommand((s) =>
    s
      .setName("configure")
      .setDescription("Configure live chat forwarding")
      .addStringOption((o) =>
        o
          .setName("type")
          .addChoices([
            { name: "All", value: "all" },
            { name: "Region", value: "region" },
            { name: "Empire", value: "empire" },
            { name: "Local", value: "local" },
          ])
          .setDescription("The type of messages to forward")
          .setRequired(true)
      )
      .addChannelOption((o) =>
        o
          .addChannelTypes([ChannelType.GuildText])
          .setName("channel")
          .setDescription("The channel to forward messages to")
          .setRequired(true)
      )
  )
  .addSubcommand((s) =>
    s
      .setName("stop")
      .setDescription("Stop forwarding live chat messages")
      .addStringOption((o) =>
        o
          .setName("type")
          .addChoices([
            { name: "All", value: "all" },
            { name: "Region", value: "region" },
            { name: "Empire", value: "empire" },
            { name: "Local", value: "local" },
          ])
          .setDescription("The type of messages to unsubscribe from")
          .setRequired(true)
      )
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("configure", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const type = i.options.getString("type", true);
    const channel = i.options.getChannel("channel", true) as TextChannel;

    const existingConfig = await QueryBus.execute(
      new GetServerConfigQuery({
        serverId: i.guildId,
      })
    );

    if (!existingConfig.ok) {
      throw new Error("Failed to fetch server configuration");
    }

    const { webhooks } = existingConfig.data ?? {};

    if (type === "region" || type === "all") {
      if (webhooks.liveRegionChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveRegionChatWebhookId);
      }

      const regionWebhook = await channel.createWebhook({
        name: "classis-botrealis-region-chat",
      });

      webhooks.liveRegionChatWebhookId = regionWebhook.id;
      webhooks.liveRegionChatWebhookToken = regionWebhook.token;
    }

    if (type === "empire" || type === "all") {
      if (webhooks.liveEmpireChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveEmpireChatWebhookId);
      }

      const empireWebhook = await channel.createWebhook({
        name: "classis-botrealis-empire-chat",
      });
      webhooks.liveEmpireChatWebhookId = empireWebhook.id;
      webhooks.liveEmpireChatWebhookToken = empireWebhook.token;
    }

    if (type === "local" || type === "all") {
      if (webhooks.liveLocalChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveLocalChatWebhookId);
      }

      const localWebhook = await channel.createWebhook({
        name: "classis-botrealis-local-chat",
      });
      webhooks.liveLocalChatWebhookId = localWebhook.id;
      webhooks.liveLocalChatWebhookToken = localWebhook.token;
    }

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        webhooks,
      })
    );

    if (result.ok) {
      await i.reply({
        content: `Live chat forwarding configured for ${type} messages in ${channelMention(channel.id)}`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: `Sorry, I wasn't able to configure live chat forwarding due to an internal error`,
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

    const type = i.options.getString("type", true);
    const existingConfig = await QueryBus.execute(
      new GetServerConfigQuery({
        serverId: i.guildId,
      })
    );

    if (!existingConfig.ok) {
      throw new Error("Failed to fetch server configuration");
    }

    const { webhooks } = existingConfig.data ?? {};

    if (type === "region" || type === "all") {
      if (webhooks.liveRegionChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveRegionChatWebhookId);
        await CommandBus.execute(
          new UpdateServerConfigCommand({
            serverId: i.guildId,
            webhooks: {
              liveRegionChatWebhookId: null,
              liveRegionChatWebhookToken: null,
            },
          })
        );
      }
    }

    if (type === "empire" || type === "all") {
      if (webhooks.liveEmpireChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveEmpireChatWebhookId);
        await CommandBus.execute(
          new UpdateServerConfigCommand({
            serverId: i.guildId,
            webhooks: {
              liveEmpireChatWebhookId: null,
              liveEmpireChatWebhookToken: null,
            },
          })
        );
      }
    }

    if (type === "local" || type === "all") {
      if (webhooks.liveLocalChatWebhookId) {
        await i.client.deleteWebhook(webhooks.liveLocalChatWebhookId);
        await CommandBus.execute(
          new UpdateServerConfigCommand({
            serverId: i.guildId,
            webhooks: {
              liveLocalChatWebhookId: null,
              liveLocalChatWebhookToken: null,
            },
          })
        );
      }
    }

    await i.reply({
      content: `Live chat forwarding stopped for ${type} messages`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
