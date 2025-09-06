import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.user_links */
export type UserLinksBitcraftUserId = string & { __brand: "public.user_links" };

/** Represents the table public.user_links */
export default interface UserLinksTable {
  bitcraft_user_id: ColumnType<
    UserLinksBitcraftUserId,
    UserLinksBitcraftUserId,
    UserLinksBitcraftUserId
  >;

  discord_user_id: ColumnType<string, string, string>;

  is_primary_account: ColumnType<boolean, boolean, boolean>;
}

export type UserLinks = Selectable<UserLinksTable>;

export type NewUserLinks = Insertable<UserLinksTable>;

export type UserLinksUpdate = Updateable<UserLinksTable>;
