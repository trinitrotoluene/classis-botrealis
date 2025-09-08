import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.tracked_inventory_requests */
export type TrackedInventoryRequestsId = string & {
  __brand: "public.tracked_inventory_requests";
};

/** Represents the table public.tracked_inventory_requests */
export default interface TrackedInventoryRequestsTable {
  id: ColumnType<
    TrackedInventoryRequestsId,
    TrackedInventoryRequestsId | undefined,
    TrackedInventoryRequestsId
  >;

  name: ColumnType<string, string, string>;

  status_message_id: ColumnType<string, string, string>;

  creator_discord_id: ColumnType<string, string, string>;

  creator_bitcraft_id: ColumnType<string, string, string>;

  target_channel_id: ColumnType<string, string, string>;

  discord_server_id: ColumnType<string, string, string>;
}

export type TrackedInventoryRequests =
  Selectable<TrackedInventoryRequestsTable>;

export type NewTrackedInventoryRequests =
  Insertable<TrackedInventoryRequestsTable>;

export type TrackedInventoryRequestsUpdate =
  Updateable<TrackedInventoryRequestsTable>;
