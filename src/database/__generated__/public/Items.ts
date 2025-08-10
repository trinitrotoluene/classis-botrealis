import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.items */
export type ItemsId = string & { __brand: 'public.items' };

/** Represents the table public.items */
export default interface ItemsTable {
  id: ColumnType<ItemsId, ItemsId, ItemsId>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string | null, string | null, string | null>;

  volume: ColumnType<number, number, number>;

  tier: ColumnType<number, number, number>;

  rarity: ColumnType<string, string, string>;

  item_list_id: ColumnType<number, number, number>;

  has_compendium_entry: ColumnType<boolean, boolean, boolean>;
}

export type Items = Selectable<ItemsTable>;

export type NewItems = Insertable<ItemsTable>;

export type ItemsUpdate = Updateable<ItemsTable>;