import type { IBitcraftBuyOrderAdded } from "@src/framework";
import { BuyOrderCache } from "../services/BuyOrderCache";

export async function onBuyOrderAdded(event: IBitcraftBuyOrderAdded) {
  const { order } = event;
  BuyOrderCache.add(order);
}
