import GetUsernameQuery from "@src/application/queries/bitcraft/GetUsernameQuery";
import GetAllWebhooksForChannelQuery from "@src/application/queries/config/GetAllWebhooksForChannelQuery";
import { ChannelId, QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import type {
  BitcraftChatMessage,
  BitcraftUserModerationState,
} from "@src/vela";
import { MessageFlags, WebhookClient } from "discord.js";

const clientCache: Record<string, WebhookClient> = {};

export async function onBitcraftChatMessage(payload: BitcraftChatMessage) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({ channelId: payload.ChannelId }),
  );

  if (!response.ok) {
    logger.warn(
      `Failed to fetch configured webhooks for channel ${payload.ChannelId}`,
    );
    return;
  }

  await Promise.all(
    response.data.results.map((config) => {
      return sendWebhook(config, {
        username: payload.SenderUsername,
        content: payload.Content,
      });
    }),
  );
}

export async function onBitcraftUserModerated(
  payload: BitcraftUserModerationState,
) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({ channelId: ChannelId.Region }),
  );

  if (!response.ok) {
    logger.warn(
      `Failed to fetch configured webhooks for channel ${ChannelId.Region}`,
    );
    return;
  }

  const usernameQuery = await QueryBus.execute(
    new GetUsernameQuery({ id: payload.TargetEntityId }),
  );

  let targetName = payload.TargetEntityId;

  if (usernameQuery.ok) {
    targetName = usernameQuery.data.name ?? targetName;
  }

  await Promise.all(
    response.data.results.map((config) => {
      return sendWebhook(config, {
        username: "[SYSTEM]",
        content: `User ${targetName} had had policy ${payload.UserModerationPolicy} applied until ${payload.ExpiresAt}.`,
      });
    }),
  );
}

async function sendWebhook(
  config: { webhookId: string; webhookToken: string },
  options: { username: string; content: string },
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
      `Failed to send message via webhook`,
    );
  }
}
