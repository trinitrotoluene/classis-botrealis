import type { IBitcraftSellOrderUpdated } from "@src/framework";
import { SellOrderCache } from "../services/SellOrderCache";

export async function onSellOrderUpdated(event: IBitcraftSellOrderUpdated) {
  const { oldEntity: oldOrder, newEntity: newOrder } = event;
  SellOrderCache.remove(oldOrder);
  SellOrderCache.add(newOrder);
}
