import type { AuctionListingState } from "@src/bindings";
import type { IBitcraftAuctionOrder } from "@src/framework";

export function mapAuctionListingState(
  order: AuctionListingState
): IBitcraftAuctionOrder {
  return {
    id: order.entityId.toString(),
    ownerId: order.ownerEntityId.toString(),
    claimId: order.claimEntityId.toString(),
    price: order.priceThreshold,
    quantity: order.quantity,
    storedCoins: order.storedCoins,
    itemId: order.itemId,
  };
}
