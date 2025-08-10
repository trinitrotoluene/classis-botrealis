import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import type { IBitcraftItemAdded } from "@src/framework";

export async function onItemAdded(event: IBitcraftItemAdded) {
  const { item } = event;

  await db
    .insertInto("items")
    .values({
      id: item.id.toString() as ItemsId,
      name: item.name,
      description: item.description,
      volume: item.volume,
      tier: item.tier,
      rarity: item.rarity,
      item_list_id: item.itemListId,
      has_compendium_entry: item.hasCompendiumEntry,
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .executeTakeFirst();
}
