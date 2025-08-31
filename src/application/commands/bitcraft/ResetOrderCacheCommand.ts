import { BuyOrderCache, SellOrderCache } from "@src/application/services";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";
import { CacheClient } from "@src/vela";

export default class ResetOrderCacheCommand extends CommandBase<
  object,
  undefined
> {
  public async execute() {
    const listingsData = await CacheClient.getAllGlobal(
      "BitcraftAuctionListingState"
    );

    const buyOrderListings = listingsData
      .values()
      .filter((x) => x.StoredCoins > 0) // this means its a buy order
      .map((x) => ({
        id: x.Id,
        itemId: x.ItemId.toString(),
        price: x.Price,
        quantity: x.Quantity,
      }))
      .toArray();

    logger.info(
      `Resetting the buy order cache with ${buyOrderListings.length} items`
    );
    BuyOrderCache.init(buyOrderListings);

    const sellOrderListings = listingsData
      .values()
      .filter((x) => x.StoredCoins === 0) // this means its a sell order
      .map((x) => ({
        id: x.Id,
        itemId: x.ItemId.toString(),
        price: x.Price,
        quantity: x.Quantity,
      }))
      .toArray();

    logger.info(
      `Resetting the sell order cache with ${sellOrderListings.length} items`
    );
    SellOrderCache.init(sellOrderListings);

    return undefined;
  }
}
