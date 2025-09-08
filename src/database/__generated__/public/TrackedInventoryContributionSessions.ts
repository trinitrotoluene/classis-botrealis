import type { TrackedInventoriesId } from "./TrackedInventories";
import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.tracked_inventory_contribution_sessions */
export type TrackedInventoryContributionSessionsId = string & {
  __brand: "public.tracked_inventory_contribution_sessions";
};

/** Represents the table public.tracked_inventory_contribution_sessions */
export default interface TrackedInventoryContributionSessionsTable {
  id: ColumnType<
    TrackedInventoryContributionSessionsId,
    TrackedInventoryContributionSessionsId | undefined,
    TrackedInventoryContributionSessionsId
  >;

  tracked_inventory_id: ColumnType<
    TrackedInventoriesId,
    TrackedInventoriesId,
    TrackedInventoriesId
  >;
}

export type TrackedInventoryContributionSessions =
  Selectable<TrackedInventoryContributionSessionsTable>;

export type NewTrackedInventoryContributionSessions =
  Insertable<TrackedInventoryContributionSessionsTable>;

export type TrackedInventoryContributionSessionsUpdate =
  Updateable<TrackedInventoryContributionSessionsTable>;
