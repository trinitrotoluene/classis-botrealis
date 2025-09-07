/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("tracked_inventory_requests")
    .addColumn("id", "bigserial", (c) => c.primaryKey().notNull())
    .addColumn("name", "varchar(128)", (c) => c.notNull())
    .addColumn("status_message_id", "varchar(20)", (c) => c.notNull())
    .addColumn("creator_discord_id", "varchar(20)", (c) => c.notNull())
    .addColumn("creator_bitcraft_id", "varchar(32)", (c) => c.notNull())
    .addColumn("target_channel_id", "varchar(20)", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("tracked_inventories")
    .addColumn("id", "bigserial", (c) => c.primaryKey().notNull())
    .addColumn("name", "varchar(128)", (c) => c.notNull())
    .addColumn("creator_discord_id", "varchar(20)", (c) => c.notNull())
    .addColumn("creator_bitcraft_id", "varchar(32)", (c) => c.notNull())
    .addColumn("status_message_id", "varchar(20)", (c) => c.notNull())
    .addColumn("target_channel_id", "varchar(20)", (c) => c.notNull())
    .addColumn("bitcraft_inventory_id", "varchar(32)", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("tracked_inventory_contributions")
    .addColumn("id", "bigserial", (c) => c.primaryKey().notNull())
    .addColumn("tracked_inventory_id", "bigint", (c) => c.notNull())
    .addColumn("item_id", "varchar(32)", (c) => c.notNull())
    .addColumn("change", "integer", (c) => c.notNull())
    .addColumn("bitcraft_user_id", "varchar(32)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("tracked_inventory_contributions").execute();
  await db.schema.dropTable("tracked_inventories").execute();
  await db.schema.dropTable("tracked_inventory_requests").execute();
}
