import type { ItemDesc } from "@src/bindings";
import type { IBitcraftItem } from "@src/framework";

export function mapItem(item: ItemDesc): IBitcraftItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    volume: item.volume,
    tier: item.tier,
    rarity: item.rarity.tag,
    itemListId: item.itemListId,
    hasCompendiumEntry: item.compendiumEntry,
  };
}
