import type { IBitcraftSellOrdersInit } from "@src/framework";
import { logger } from "@src/logger";
import { SellOrderCache } from "../services/SellOrderCache";

export async function onSellOrdersInit(event: IBitcraftSellOrdersInit) {
  const { orders } = event;

  logger.info(`Initialising sell order cache with ${orders.length} items`);
  SellOrderCache.init(orders);
}
