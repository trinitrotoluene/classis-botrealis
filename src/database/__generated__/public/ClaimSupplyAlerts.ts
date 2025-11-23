import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.claim_supply_alerts */
export type ClaimSupplyAlertsId = string & {
  __brand: "public.claim_supply_alerts";
};

/** Represents the table public.claim_supply_alerts */
export default interface ClaimSupplyAlertsTable {
  id: ColumnType<
    ClaimSupplyAlertsId,
    ClaimSupplyAlertsId | undefined,
    ClaimSupplyAlertsId
  >;

  discord_server_id: ColumnType<string, string, string>;

  claim_id: ColumnType<string, string, string>;

  supply_threshold: ColumnType<number, number, number>;
}

export type ClaimSupplyAlerts = Selectable<ClaimSupplyAlertsTable>;

export type NewClaimSupplyAlerts = Insertable<ClaimSupplyAlertsTable>;

export type ClaimSupplyAlertsUpdate = Updateable<ClaimSupplyAlertsTable>;
