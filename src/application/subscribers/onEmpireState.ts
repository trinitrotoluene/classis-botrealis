import { PubSub, type IBitcraftEmpireUpdated } from "@src/framework";
import NodeCache from "node-cache";

const EventCache = new NodeCache({ stdTTL: 5 });

export async function onEmpireUpdated(event: IBitcraftEmpireUpdated) {
  const { oldEntity, newEntity } = event;
  const cacheKey = `${newEntity.id}-${oldEntity.shardTreasury}-${newEntity.shardTreasury}`;
  if (EventCache.has(cacheKey)) {
    return;
  }

  EventCache.set(cacheKey, true);

  if (oldEntity.shardTreasury !== newEntity.shardTreasury) {
    PubSub.publish("application_empire_treasury_changed", {
      type: "application_empire_treasury_changed",
      empire: {
        id: newEntity.id,
        name: newEntity.name,
      },
      oldAmount: oldEntity.shardTreasury,
      newAmount: newEntity.shardTreasury,
    });
  }
}
