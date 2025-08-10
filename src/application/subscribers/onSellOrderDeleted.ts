import type { IBitcraftSellOrderDeleted } from "@src/framework";
import { SellOrderCache } from "../services/SellOrderCache";

export async function onSellOrderDeleted(event: IBitcraftSellOrderDeleted) {
  const { order } = event;
  SellOrderCache.remove(order);
}
