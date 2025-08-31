import { db } from "@src/database";
import type {
  ItemsId,
  NewItems,
} from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import { chunkIterator } from "@src/framework/chunkIterator";
import { logger } from "@src/logger";
import { CacheClient } from "@src/vela";

export default class UpsertItemsFromCacheCommand extends CommandBase<
  object,
  undefined
> {
  public async execute() {
    const itemData = await CacheClient.getAllGlobal("BitcraftItem");
    const items = itemData.values().toArray();

    logger.info(`Initialising item data with ${items.length} items`);
    // Go 750 items at a time
    for (const chunk of chunkIterator(items, 750)) {
      // For each item, map it to the structure expected by the DB
      const values: NewItems[] = [];
      for (const item of chunk) {
        values.push({
          id: item.Id as ItemsId,
          name: item.Name,
          description: item.Description,
          volume: item.Volume,
          tier: item.Tier === -1 ? 0 : item.Tier,
          rarity: item.Rarity,
          item_list_id: item.ItemListId,
          has_compendium_entry: item.HasCompendiumEntry,
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
            has_compendium_entry: eb.ref("excluded.has_compendium_entry"),
          }))
        )
        .execute();
    }
    return undefined;
  }
}
