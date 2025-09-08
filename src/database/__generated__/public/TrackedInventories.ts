import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.tracked_inventories */
export type TrackedInventoriesId = string & {
  __brand: "public.tracked_inventories";
};

/** Represents the table public.tracked_inventories */
export default interface TrackedInventoriesTable {
  id: ColumnType<
    TrackedInventoriesId,
    TrackedInventoriesId | undefined,
    TrackedInventoriesId
  >;

  name: ColumnType<string, string, string>;

  creator_discord_id: ColumnType<string, string, string>;

  creator_bitcraft_id: ColumnType<string, string, string>;

  status_message_id: ColumnType<string, string, string>;

  target_channel_id: ColumnType<string, string, string>;

  bitcraft_inventory_id: ColumnType<string, string, string>;

  discord_server_id: ColumnType<string, string, string>;
}

export type TrackedInventories = Selectable<TrackedInventoriesTable>;

export type NewTrackedInventories = Insertable<TrackedInventoriesTable>;

export type TrackedInventoriesUpdate = Updateable<TrackedInventoriesTable>;
