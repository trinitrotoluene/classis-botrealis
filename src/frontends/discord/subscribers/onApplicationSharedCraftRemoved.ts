import type { IApplicationSharedCraftRemoved } from "@src/framework";
import { Routes, type Client } from "discord.js";

export const CraftAnnouncedSet = new Map<
  string,
  Array<{ messageId: string; channelId: string }>
>();

export async function onApplicationSharedCraftRemoved(
  client: Client,
  event: IApplicationSharedCraftRemoved
) {
  const context = CraftAnnouncedSet.get(event.id);
  if (!context) {
    return;
  }

  await Promise.allSettled(
    context.values().map(async ({ channelId, messageId }) => {
      try {
        await client.rest.put(
          Routes.channelMessageOwnReaction(
            channelId,
            messageId,
            encodeURIComponent("❌")
          )
        );
      } finally {
        // We don't really care if this fails
      }
    })
  );
}
