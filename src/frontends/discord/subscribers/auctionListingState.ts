import AddToOrderCacheCommand from "@src/application/commands/bitcraft/AddToOrderCacheCommand";
import RemoveFromOrderCacheCommand from "@src/application/commands/bitcraft/RemoveFromOrderCacheCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftAuctionListingState } from "@src/vela";

export async function onAuctionListingStateInserted(
  state: BitcraftAuctionListingState
) {
  await CommandBus.execute(new AddToOrderCacheCommand(state));
}

export async function onAuctionListingStateDeleted(
  state: BitcraftAuctionListingState
) {
  await CommandBus.execute(new RemoveFromOrderCacheCommand(state));
}

export async function onAuctionListingStateUpdated(
  oldState: BitcraftAuctionListingState,
  newState: BitcraftAuctionListingState
) {
  await CommandBus.execute(new RemoveFromOrderCacheCommand(oldState));
  await CommandBus.execute(new AddToOrderCacheCommand(newState));
}
