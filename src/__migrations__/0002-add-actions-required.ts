/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("recipes")
    .addColumn("actions_required", "int4", (c) => c.defaultTo(0))
    .execute();

  await db.schema
    .alterTable("server_config")
    .addColumn("shared_craft_thread_id", "varchar(20)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("recipes")
    .dropColumn("actions_required")
    .execute();

  await db.schema
    .alterTable("server_config")
    .dropColumn("shared_craft_thread_id")
    .execute();
}
