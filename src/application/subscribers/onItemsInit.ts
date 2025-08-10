import { db } from "@src/database";
import type {
  ItemsId,
  NewItems,
} from "@src/database/__generated__/public/Items";
import type { IBitcraftItemsInit } from "@src/framework";
import { chunkIterator } from "@src/framework/chunkIterator";
import { logger } from "@src/logger";

export async function onItemsInit(event: IBitcraftItemsInit) {
  const { items } = event;

  logger.info(`Initialising item data with ${items.length} items`);

  // Go 750 items at a time
  for (const chunk of chunkIterator(items, 750)) {
    // For each item, map it to the structure expected by the DB
    const values: NewItems[] = [];
    for (const item of chunk) {
      values.push({
        id: item.id.toString() as ItemsId,
        name: item.name,
        description: item.description,
        volume: item.volume,
        tier: item.tier === -1 ? 0 : item.tier,
        rarity: item.rarity,
        item_list_id: item.itemListId,
        has_compendium_entry: item.hasCompendiumEntry,
      });
    }

    // Bulk upsert
    await db
      .insertInto("items")
      .values(values)
      .onConflict((oc) =>
        oc.column("id").doUpdateSet((eb) => ({
          name: eb.ref("excluded.name"),
          description: eb.ref("excluded.description"),
          volume: eb.ref("excluded.volume"),
          tier: eb.ref("excluded.tier"),
          rarity: eb.ref("excluded.rarity"),
          item_list_id: eb.ref("excluded.item_list_id"),
        }))
      )
      .execute();
  }
}
