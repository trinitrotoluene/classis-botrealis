import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import type { IBitcraftItemUpdated } from "@src/framework";

export async function onItemUpdated(event: IBitcraftItemUpdated) {
  const { newEntity: item } = event;

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
    .executeTakeFirst();
}
