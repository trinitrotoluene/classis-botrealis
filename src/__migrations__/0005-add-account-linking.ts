/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user_link_requests")
    .addColumn("id", "bigserial")
    .addColumn("discord_user_id", "varchar(20)", (c) => c.notNull())
    .addColumn("link_token", "varchar(20)", (c) => c.notNull())
    .addColumn("link_token_expires_at", "timestamptz", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("user_links")
    .addColumn("bitcraft_user_id", "varchar(32)", (col) => col.primaryKey())
    .addColumn("discord_user_id", "varchar(20)", (c) => c.notNull())
    .addColumn("is_primary_account", "boolean", (c) => c.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("user_links").execute();
  await db.schema.dropTable("user_link_requests").execute();
}
