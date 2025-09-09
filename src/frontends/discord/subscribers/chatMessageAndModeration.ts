import CompleteUserLinkRequestCommand from "@src/application/commands/config/CompleteUserLinkRequestCommand";
import GetUsernameQuery from "@src/application/queries/bitcraft/GetUsernameQuery";
import GetAllWebhooksForChannelQuery from "@src/application/queries/config/GetAllWebhooksForChannelQuery";
import { ChannelId, CommandBus, QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import type {
  BitcraftChatMessage,
  BitcraftUserModerationState,
  IEventContext,
} from "@src/vela";
import { MessageFlags, WebhookClient } from "discord.js";
import { DiscordBot } from "../bot";

const clientCache: Record<string, WebhookClient> = {};

export async function onBitcraftChatMessage(
  _ctx: IEventContext,
  payload: BitcraftChatMessage,
) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({
      module: payload.Module ?? "",
      channelId: payload.ChannelId,
    }),
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

  const linkResponse = await CommandBus.execute(
    new CompleteUserLinkRequestCommand(payload),
  );

  if (linkResponse.ok && linkResponse.data) {
    await notifyUserLinked(
      linkResponse.data.discordUserId,
      linkResponse.data.bitcraftUsername,
    );
  }
}

export async function onBitcraftUserModerated(
  _ctx: IEventContext,
  payload: BitcraftUserModerationState,
) {
  const response = await QueryBus.execute(
    new GetAllWebhooksForChannelQuery({
      module: payload.Module ?? "",
      channelId: ChannelId.Region,
    }),
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
    // todo track failures in-memory and delete the config if too many in a (long) interval
    logger.error(
      { error, config, options },
      `Failed to send message via webhook`,
    );
  }
}

async function notifyUserLinked(
  discordUserId: string,
  bitcraftUsername: string,
) {
  try {
    const dm = await DiscordBot.users.createDM(discordUserId);
    await dm.send({
      content: `Linked your discord account to bitcraft user ${bitcraftUsername}
-# If you weren't expecting to receive this DM, please reach out to \`@trin1trotoluene\``,
    });
  } catch (err) {
    logger.error(err);
  }
}
