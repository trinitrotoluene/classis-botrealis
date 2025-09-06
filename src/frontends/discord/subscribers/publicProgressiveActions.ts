import { ContainerBuilder, MessageFlags, Routes } from "discord.js";
import { DiscordBot } from "../bot";
import { type BitcraftPublicProgressiveAction } from "@src/vela";
import { logger } from "@src/logger";
import GetPublicCraftQuery from "@src/application/queries/bitcraft/GetPublicCraftQuery";
import { QueryBus } from "@src/framework";
import GetAllSharedCraftThreadsQuery from "@src/application/queries/config/GetAllSharedCraftThreadsQuery";
import { generateMapUrl } from "@src/utils/generateMapUrl";

const CraftAnnouncedSet = new Map<
  string,
  Array<{ messageId: string; channelId: string }>
>();

export async function onSharedCraftInserted(
  event: BitcraftPublicProgressiveAction,
) {
  const sharedCraftResult = await QueryBus.execute(
    new GetPublicCraftQuery(event),
  );

  if (!sharedCraftResult.ok || !sharedCraftResult.data) {
    return;
  }

  const { location, claim, producedItems, user, progress, effort } =
    sharedCraftResult.data;

  const serversToNotify = await QueryBus.execute(
    new GetAllSharedCraftThreadsQuery({}),
  );

  if (!serversToNotify.ok) {
    return;
  }

  let mapUrl: string | undefined;

  if (location) {
    mapUrl = generateMapUrl(location.X, location.Z, claim?.Name ?? "n/a");
  }

  const formatProducedItem = (item: (typeof producedItems)[0]) =>
    item ? `**[T${item.tier}] ${item.name}**` : "n/a";

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(`### ${formatProducedItem(producedItems[0])}
👤 ${user?.Username ?? "n/a"} at ${mapUrl ? `[${claim?.Name}](${mapUrl})` : claim?.Name}
🛠️ **${effort - progress}** effort remaining of ${effort}!`),
    );

  const results = await Promise.allSettled(
    serversToNotify.data.results.map((x) =>
      DiscordBot.channels.fetch(x.threadId),
    ),
  );

  await Promise.all(
    results.map((x) => {
      if (x.status === "rejected" || !x.value) {
        return Promise.resolve();
      }

      const channel = x.value;
      if (channel.isSendable()) {
        return channel.send({
          components: [builder],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }),
  );
}

export async function onSharedCraftDeleted(
  event: BitcraftPublicProgressiveAction,
) {
  const context = CraftAnnouncedSet.get(event.Id);
  if (!context) {
    return;
  }

  await Promise.allSettled(
    context.values().map(async ({ channelId, messageId }) => {
      try {
        await DiscordBot.rest.put(
          Routes.channelMessageOwnReaction(
            channelId,
            messageId,
            encodeURIComponent("❌"),
          ),
        );
      } catch (err) {
        // We don't really care if this fails
        logger.error(err, "error reacting to message");
      }
    }),
  );
}
