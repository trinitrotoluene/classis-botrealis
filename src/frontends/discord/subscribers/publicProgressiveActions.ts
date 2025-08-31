import { ContainerBuilder, MessageFlags, Routes } from "discord.js";
import { DiscordBot } from "../bot";
import { type BitcraftPublicProgressiveAction } from "@src/vela";
import { logger } from "@src/logger";
import GetPublicCraftQuery from "@src/application/queries/bitcraft/GetPublicCraftQuery";
import { QueryBus } from "@src/framework";
import GetAllSharedCraftThreadsQuery from "@src/application/queries/config/GetAllSharedCraftThreadsQuery";

const CraftAnnouncedSet = new Map<
  string,
  Array<{ messageId: string; channelId: string }>
>();

export async function onSharedCraftInserted(
  event: BitcraftPublicProgressiveAction
) {
  const sharedCraftResult = await QueryBus.execute(
    new GetPublicCraftQuery(event)
  );

  if (!sharedCraftResult.ok || !sharedCraftResult.data) {
    return;
  }

  const { location, claim, producedItems, user, progress, effort } =
    sharedCraftResult.data;

  const serversToNotify = await QueryBus.execute(
    new GetAllSharedCraftThreadsQuery({})
  );

  if (!serversToNotify.ok) {
    return;
  }

  let mapUrl: string | undefined;

  if (location) {
    const mapOptions = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            popupText: event.claimName,
            iconName: "waypoint",
            turnLayerOff: ["ruinedLayer", "treesLayer", "templesLayer"],
          },
          geometry: {
            type: "Point",
            coordinates: [location.X, location.Z],
          },
        },
      ],
    };

    // this should be urlencoded but bitcraftmap doesn't seem to currently handle that correctly
    const encodedMapOptions = JSON.stringify(mapOptions).replaceAll(" ", "%20");
    mapUrl = `https://bitcraftmap.com/#${encodedMapOptions}`;
  }

  const formatProducedItem = (item: (typeof producedItems)[0]) =>
    item ? `## **[T${item.tier}] ${item.name}**` : "n/a";

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(formatProducedItem(producedItems[0]))
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(`\`\`\`
Claim    : ${claim?.Name}
User     : ${user?.Username ?? "n/a"}

(${progress}/${effort})
\`\`\`
`)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(mapUrl ? `[bitcraftmap.com](${mapUrl})` : "n/a")
    );

  const results = await Promise.allSettled(
    serversToNotify.data.results.map((x) =>
      DiscordBot.channels.fetch(x.threadId)
    )
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
    })
  );
}

export async function onSharedCraftDeleted(
  event: BitcraftPublicProgressiveAction
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
            encodeURIComponent("❌")
          )
        );
      } catch (err) {
        // We don't really care if this fails
        logger.error(err, "error reacting to message");
      }
    })
  );
}
