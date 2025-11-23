import RemoveItemCommand from "@src/application/commands/bitcraft/RemoveItemCommand";
import UpsertItemCommand from "@src/application/commands/bitcraft/UpsertItemCommand";
import RemoveCargoItemCommand from "@src/application/commands/bitcraft/RemoveCargoItemCommand";
import UpsertCargoItemCommand from "@src/application/commands/bitcraft/UpsertCargoItemCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftItem, BitcraftCargoItem, IEventContext } from "@src/vela";

export async function onItemInserted(_ctx: IEventContext, item: BitcraftItem) {
  await CommandBus.execute(new UpsertItemCommand(item));
}

export async function onItemUpdated(
  _ctx: IEventContext,
  _oldItem: BitcraftItem,
  newItem: BitcraftItem,
) {
  await CommandBus.execute(new UpsertItemCommand(newItem));
}

export async function onItemDeleted(_ctx: IEventContext, item: BitcraftItem) {
  await CommandBus.execute(new RemoveItemCommand(item));
}

export async function onCargoItemInserted(
  _ctx: IEventContext,
  item: BitcraftCargoItem,
) {
  await CommandBus.execute(new UpsertCargoItemCommand(item));
}

export async function onCargoItemUpdated(
  _ctx: IEventContext,
  _oldItem: BitcraftCargoItem,
  newItem: BitcraftCargoItem,
) {
  await CommandBus.execute(new UpsertCargoItemCommand(newItem));
}

export async function onCargoItemDeleted(
  _ctx: IEventContext,
  item: BitcraftCargoItem,
) {
  await CommandBus.execute(new RemoveCargoItemCommand(item));
}
