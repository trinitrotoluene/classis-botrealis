/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  await db.schema
    .createTable("server_config")
    .addColumn("id", "varchar(20)", (c) => c.primaryKey())
    .addColumn("linked_claim_id", "varchar(32)")
    .addColumn("live_region_chat_webhook_id", "varchar(20)")
    .addColumn("live_region_chat_webhook_token", "varchar(100)")
    .addColumn("live_empire_chat_webhook_id", "varchar(20)")
    .addColumn("live_empire_chat_webhook_token", "varchar(100)")
    .addColumn("live_local_chat_webhook_id", "varchar(20)")
    .addColumn("live_local_chat_webhook_token", "varchar(100)")
    .execute();

  await db.schema
    .createTable("items")
    .addColumn("id", "bigint", (c) => c.primaryKey())
    .addColumn("name", "varchar(255)", (c) => c.notNull())
    .addColumn("description", "text")
    .addColumn("volume", "int4", (c) => c.notNull())
    .addColumn("tier", "int4", (c) => c.notNull())
    .addColumn("rarity", "varchar(50)", (c) => c.notNull())
    .addColumn("item_list_id", "int4", (c) => c.notNull())
    .addColumn("has_compendium_entry", "boolean", (c) => c.notNull())
    .execute();

  await db.schema
    .createIndex("idx_trgm_name")
    .on("items")
    .using("gin")
    .expression(sql`name gin_trgm_ops`)
    .execute();

  await db.schema
    .createTable("recipes")
    .addColumn("id", "bigint", (c) => c.primaryKey())
    .addColumn("name", "varchar(255)", (c) => c.notNull())
    .addColumn("required_bench_type", "int4")
    .addColumn("required_bench_tier", "int4")
    .addColumn("level_requirements", "jsonb", (c) => c.notNull())
    .addColumn("tool_requirements", "jsonb", (c) => c.notNull())
    .addColumn("consumed_item_stacks", "jsonb", (c) => c.notNull())
    .addColumn("produced_item_stacks", "jsonb", (c) => c.notNull())
    .addColumn("is_passive", "boolean", (c) => c.notNull().defaultTo(false))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("server_config").execute();
  await db.schema.dropTable("items").execute();
  await db.schema.dropTable("recipes").execute();
}
