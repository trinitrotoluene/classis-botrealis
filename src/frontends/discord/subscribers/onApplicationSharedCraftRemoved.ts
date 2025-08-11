import type { IApplicationSharedCraftRemoved } from "@src/framework";
import type { Client } from "discord.js";

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
}

/* todo:
We need a mechanism to mark a craft as closed/done after it's been announced.

It doesn't need to be _that_ robust but something as simple as a Map<entityId, messageId> would work
when deleted, we remove it from the map and edit the message.

Might also want to remove it from the cache used by SharedCraftStarted as well
*/
