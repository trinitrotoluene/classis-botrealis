/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("server_config")
    .addColumn("supply_alert_channel_id", "varchar(20)")
    .execute();

  await db.schema
    .createTable("claim_supply_alerts")
    .addColumn("id", "bigserial", (c) => c.primaryKey().notNull())
    .addColumn("discord_server_id", "varchar(20)", (c) => c.notNull())
    .addColumn("claim_id", "varchar(32)", (c) => c.notNull())
    .addColumn("supply_threshold", "int4", (c) => c.notNull())
    .addUniqueConstraint("unique_discord_server_claim", [
      "discord_server_id",
      "claim_id",
    ])
    .execute();

  await sql`ALTER TYPE server_feature ADD VALUE 'supply_alerts'`.execute(db);

  await db.schema
    .createTable("cargo_items")
    .addColumn("id", "bigint", (c) => c.primaryKey())
    .addColumn("name", "varchar(255)", (c) => c.notNull())
    .addColumn("description", "text")
    .addColumn("volume", "int4", (c) => c.notNull())
    .addColumn("tier", "int4", (c) => c.notNull())
    .addColumn("rarity", "varchar(50)", (c) => c.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("server_config")
    .dropColumn("supply_alert_channel_id")
    .execute();

  await db.schema.dropTable("claim_supply_alerts").execute();

  await db.schema.dropTable("cargo_items").execute();

  // Note: PostgreSQL does not support removing values from an enum type directly.
  // This step is left as a comment for manual intervention if needed.
  // await sql`ALTER TYPE server_feature DROP VALUE 'supply_alerts'`.execute(db);
}
