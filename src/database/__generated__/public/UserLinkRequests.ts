import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Represents the table public.user_link_requests */
export default interface UserLinkRequestsTable {
  id: ColumnType<string, string | undefined, string>;

  discord_user_id: ColumnType<string, string, string>;

  link_token: ColumnType<string, string, string>;

  link_token_expires_at: ColumnType<Date, Date | string, Date | string>;
}

export type UserLinkRequests = Selectable<UserLinkRequestsTable>;

export type NewUserLinkRequests = Insertable<UserLinkRequestsTable>;

export type UserLinkRequestsUpdate = Updateable<UserLinkRequestsTable>;
