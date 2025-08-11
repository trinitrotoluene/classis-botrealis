import type { IBitcraftBuyOrderUpdated } from "@src/framework";
import { BuyOrderCache } from "../services/BuyOrderCache";

export async function onBuyOrderUpdated(event: IBitcraftBuyOrderUpdated) {
  const { oldEntity: oldOrder, newEntity: newOrder } = event;
  BuyOrderCache.remove(oldOrder);
  BuyOrderCache.add(newOrder);
}
