import type { IBitcraftBuyOrderAdded } from "@src/framework";
import { BuyOrderCache } from "../services/BuyOrderCache";

export async function onBuyOrderAdded(event: IBitcraftBuyOrderAdded) {
  const { entity: order } = event;
  BuyOrderCache.add(order);
}
