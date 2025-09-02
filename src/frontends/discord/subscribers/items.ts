import RemoveItemCommand from "@src/application/commands/bitcraft/RemoveItemCommand";
import UpsertItemCommand from "@src/application/commands/bitcraft/UpsertItemCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftItem } from "@src/vela";

export async function onItemInserted(item: BitcraftItem) {
  await CommandBus.execute(new UpsertItemCommand(item));
}

export async function onItemUpdated(
  _oldItem: BitcraftItem,
  newItem: BitcraftItem,
) {
  await CommandBus.execute(new UpsertItemCommand(newItem));
}

export async function onItemDeleted(item: BitcraftItem) {
  await CommandBus.execute(new RemoveItemCommand(item));
}
