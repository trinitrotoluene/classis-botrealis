import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.cargo_items */
export type CargoItemsId = string & { __brand: "public.cargo_items" };

/** Represents the table public.cargo_items */
export default interface CargoItemsTable {
  id: ColumnType<CargoItemsId, CargoItemsId, CargoItemsId>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string | null, string | null, string | null>;

  volume: ColumnType<number, number, number>;

  tier: ColumnType<number, number, number>;

  rarity: ColumnType<string, string, string>;
}

export type CargoItems = Selectable<CargoItemsTable>;

export type NewCargoItems = Insertable<CargoItemsTable>;

export type CargoItemsUpdate = Updateable<CargoItemsTable>;
