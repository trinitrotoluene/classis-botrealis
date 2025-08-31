import { BuyOrderCache, SellOrderCache } from "@src/application/services";
import { CommandBase } from "@src/framework";
import type { BitcraftAuctionListingState } from "@src/vela";

export default class AddToOrderCacheCommand extends CommandBase<
  BitcraftAuctionListingState,
  undefined
> {
  public async execute() {
    if (this.args.StoredCoins === 0) {
      BuyOrderCache.add({
        id: this.args.Id,
        itemId: this.args.ItemId.toString(),
        price: this.args.Price,
        quantity: this.args.Quantity,
      });
    } else {
      SellOrderCache.add({
        id: this.args.Id,
        itemId: this.args.ItemId.toString(),
        price: this.args.Price,
        quantity: this.args.Quantity,
      });
    }

    return undefined;
  }
}
