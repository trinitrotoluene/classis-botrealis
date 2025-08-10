import type { IBitcraftBuyOrdersInit } from "@src/framework";
import { logger } from "@src/logger";
import { BuyOrderCache } from "../services/BuyOrderCache";

export async function onBuyOrdersInit(event: IBitcraftBuyOrdersInit) {
  const { orders } = event;
  logger.info(`Initialising buy order cache with ${orders.length} items`);
  BuyOrderCache.init(orders);
}
