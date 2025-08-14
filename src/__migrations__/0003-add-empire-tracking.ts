/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType("server_feature")
    .asEnum(["observe_empires", "manage_projects"])
    .execute();

  await db.schema
    .alterTable("server_config")
    .addColumn("features_enabled", sql`server_feature[]`)
    .addColumn("observing_empire_ids", sql`text[]`)
    .addColumn("observing_empire_logs_thread_id", "varchar(20)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("server_config")
    .dropColumn("features_enabled")
    .dropColumn("observing_empire_ids")
    .dropColumn("observing_empire_logs_thread_id")
    .execute();
}
