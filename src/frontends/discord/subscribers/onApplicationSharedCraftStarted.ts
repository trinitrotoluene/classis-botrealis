import GetAllSharedCraftThreadsQuery from "@src/application/queries/config/GetAllSharedCraftThreadsQuery";
import { QueryBus, type IApplicationSharedCraftStarted } from "@src/framework";
import { ContainerBuilder, MessageFlags, type Client } from "discord.js";

export async function onApplicationSharedCraftStarted(
  client: Client,
  event: IApplicationSharedCraftStarted
) {
  const serversToNotify = await QueryBus.execute(
    new GetAllSharedCraftThreadsQuery({})
  );

  if (!serversToNotify.ok) {
    return;
  }

  let mapUrl: string | undefined;

  if (event.location) {
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
            coordinates: [event.location.x, event.location.y],
          },
        },
      ],
    };

    // this should be urlencoded but bitcraftmap doesn't seem to currently handle that correctly
    const encodedMapOptions = JSON.stringify(mapOptions).replaceAll(" ", "%20");
    mapUrl = `https://bitcraftmap.com/#${encodedMapOptions}`;
  }

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(`## Shared craft started\n-# ${event.id}`)
    )
    .addTextDisplayComponents(
      (c) => c.setContent(`Total effort: ${event.progress}/${event.effort}`),
      (c) => c.setContent(`Claim: ${event.claimName}`),
      (c) => c.setContent(mapUrl ? `[bitcraftmap.com](${mapUrl})` : "n/a")
    )
    .addSeparatorComponents((s) => s);

  const formatProducedItem = (item: (typeof event.producedItems)[0]) =>
    `**[T${item.tier}] ${item.name}**`;

  const items = event.producedItems;
  for (let i = 0; i < items.length; i += 3) {
    if (!items[i]) {
      break;
    }

    builder.addTextDisplayComponents(
      (c) => c.setContent(formatProducedItem(items[i]))
      // (c) =>
      //   items[i + 1] ? c.setContent(formatProducedItem(items[i + 1])) : c,
      // (c) => (items[i + 2] ? c.setContent(formatProducedItem(items[i + 2])) : c)
    );
  }

  const results = await Promise.allSettled(
    serversToNotify.data.results.map((x) => client.channels.fetch(x.threadId))
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
