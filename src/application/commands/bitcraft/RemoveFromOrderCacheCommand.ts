import { BuyOrderCache, SellOrderCache } from "@src/application/services";
import { CommandBase } from "@src/framework";
import type { BitcraftAuctionListingState } from "@src/vela";

export default class RemoveFromOrderCacheCommand extends CommandBase<
  BitcraftAuctionListingState,
  undefined
> {
  public async execute() {
    BuyOrderCache.remove({
      id: this.args.Id,
      itemId: this.args.ItemId.toString(),
      price: this.args.Price,
      quantity: this.args.Quantity,
    });

    SellOrderCache.remove({
      id: this.args.Id,
      itemId: this.args.ItemId.toString(),
      price: this.args.Price,
      quantity: this.args.Quantity,
    });

    return undefined;
  }
}
