import type { IBitcraftSellOrderAdded } from "@src/framework";
import { SellOrderCache } from "../services/SellOrderCache";

export async function onSellOrderAdded(event: IBitcraftSellOrderAdded) {
  const { entity: order } = event;
  SellOrderCache.add(order);
}
