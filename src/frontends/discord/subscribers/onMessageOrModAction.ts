import GetAllWebhooksForChannelQuery from "@src/application/queries/config/GetAllWebhooksForChannelQuery";
import {
  ChannelId,
  QueryBus,
  type IBitcraftChatMessageEvent,
  type IBitcraftUserModeratedEvent,
} from "@src/framework";
import { logger } from "@src/logger";
import { MessageFlags, WebhookClient } from "discord.js";

const clientCache: Record<string, WebhookClient> = {};

export function onMessageOrModAction(
  payload: IBitcraftChatMessageEvent | IBitcraftUserModeratedEvent
) {
  if (payload.type === "bitcraft_chat_message") {
    return onBitcraftChatMessage(payload);
  } else {
    return onBitcraftUserModerated(payload);
  }
}

async function onBitcraftChatMessage(payload: IBitcraftChatMessageEvent) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({ channelId: payload.channelId })
  );

  if (!response.ok) {
    logger.warn(
      `Failed to fetch configured webhooks for channel ${payload.channelId}`
    );
    return;
  }

  await Promise.all(
    response.data.results.map((config) => {
      return sendWebhook(config, {
        username: `[${payload.channelId}] ${payload.senderUsername}`,
        content: payload.content,
      });
    })
  );
}

async function onBitcraftUserModerated(payload: IBitcraftUserModeratedEvent) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({ channelId: ChannelId.Region })
  );

  if (!response.ok) {
    logger.warn(
      `Failed to fetch configured webhooks for channel ${ChannelId.Region}`
    );
    return;
  }

  await Promise.all(
    response.data.results.map((config) => {
      return sendWebhook(config, {
        username: "[SYSTEM]",
        content: `User ${payload.targetId} has been moderated by ${payload.createdByEntityId} using policy ${payload.userModerationPolicy}.`,
      });
    })
  );
}

async function sendWebhook(
  config: { webhookId: string; webhookToken: string },
  options: { username: string; content: string }
) {
  const { webhookId, webhookToken } = config;

  if (!clientCache[webhookId]) {
    clientCache[webhookId] = new WebhookClient({
      id: webhookId,
      token: webhookToken,
    });
  }
  const webhook = clientCache[webhookId];

  try {
    await webhook.send({
      content: options.content,
      username: options.username,
      flags: MessageFlags.SuppressEmbeds | MessageFlags.SuppressNotifications,
      allowedMentions: {},
    });
  } catch (error) {
    logger.error(
      { error, config, options },
      `Failed to send message via webhook`
    );
  }
}
