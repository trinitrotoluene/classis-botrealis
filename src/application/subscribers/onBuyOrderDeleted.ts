import type { IBitcraftBuyOrderDeleted } from "@src/framework";
import { BuyOrderCache } from "../services/BuyOrderCache";

export async function onBuyOrderDeleted(event: IBitcraftBuyOrderDeleted) {
  const { order } = event;
  BuyOrderCache.remove(order);
}
