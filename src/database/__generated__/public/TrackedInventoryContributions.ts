import type { TrackedInventoryContributionSessionsId } from "./TrackedInventoryContributionSessions";
import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.tracked_inventory_contributions */
export type TrackedInventoryContributionsId = string & {
  __brand: "public.tracked_inventory_contributions";
};

/** Represents the table public.tracked_inventory_contributions */
export default interface TrackedInventoryContributionsTable {
  id: ColumnType<
    TrackedInventoryContributionsId,
    TrackedInventoryContributionsId | undefined,
    TrackedInventoryContributionsId
  >;

  tracked_inventory_id: ColumnType<string, string, string>;

  item_id: ColumnType<string, string, string>;

  change: ColumnType<number, number, number>;

  bitcraft_user_id: ColumnType<string | null, string | null, string | null>;

  session_id: ColumnType<
    TrackedInventoryContributionSessionsId,
    TrackedInventoryContributionSessionsId,
    TrackedInventoryContributionSessionsId
  >;
}

export type TrackedInventoryContributions =
  Selectable<TrackedInventoryContributionsTable>;

export type NewTrackedInventoryContributions =
  Insertable<TrackedInventoryContributionsTable>;

export type TrackedInventoryContributionsUpdate =
  Updateable<TrackedInventoryContributionsTable>;
