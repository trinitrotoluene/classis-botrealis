import AddToOrderCacheCommand from "@src/application/commands/bitcraft/AddToOrderCacheCommand";
import RemoveFromOrderCacheCommand from "@src/application/commands/bitcraft/RemoveFromOrderCacheCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftAuctionListingState, IEventContext } from "@src/vela";

export async function onAuctionListingStateInserted(
  _ctx: IEventContext,
  state: BitcraftAuctionListingState,
) {
  await CommandBus.execute(new AddToOrderCacheCommand(state));
}

export async function onAuctionListingStateDeleted(
  _ctx: IEventContext,
  state: BitcraftAuctionListingState,
) {
  await CommandBus.execute(new RemoveFromOrderCacheCommand(state));
}

export async function onAuctionListingStateUpdated(
  _ctx: IEventContext,
  oldState: BitcraftAuctionListingState,
  newState: BitcraftAuctionListingState,
) {
  await CommandBus.execute(new RemoveFromOrderCacheCommand(oldState));
  await CommandBus.execute(new AddToOrderCacheCommand(newState));
}
