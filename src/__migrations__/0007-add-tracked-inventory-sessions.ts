/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add server ID to tracked_inventories for autocompletion purposes
  // assume CSB server ID by default - this defaulting should be removed later
  await db.schema
    .alterTable("tracked_inventory_requests")
    .addColumn("discord_server_id", "varchar(20)", (c) =>
      c.notNull().defaultTo("1260764379415052399"),
    )
    .execute();
  await db.schema
    .alterTable("tracked_inventory_requests")
    .alterColumn("discord_server_id", (c) => c.dropDefault())
    .execute();

  await db.schema
    .alterTable("tracked_inventories")
    .addColumn("discord_server_id", "varchar(20)", (c) =>
      c.notNull().defaultTo("1260764379415052399"),
    )
    .execute();
  await db.schema
    .alterTable("tracked_inventories")
    .alterColumn("discord_server_id", (c) => c.dropDefault())
    .execute();

  // Introduce new sessions table that is 1-many with contributions and 1-1 with tracked_inventories
  await db.schema
    .createTable("tracked_inventory_contribution_sessions")
    .addColumn("id", "bigserial", (c) => c.primaryKey().notNull())
    .addColumn("tracked_inventory_id", "bigint", (c) =>
      c.notNull().references("tracked_inventories.id").onDelete("cascade"),
    )
    .execute();

  // modify contributions table to point at sessions
  await db.schema
    .alterTable("tracked_inventory_contributions")
    .addColumn("session_id", "bigint", (c) =>
      c
        .references("tracked_inventory_contribution_sessions.id")
        .onDelete("cascade"),
    )
    .execute();

  const existingTracking = await db
    .selectFrom("tracked_inventories")
    .select(["id", "bitcraft_inventory_id"])
    .execute();

  const sessionIdMap = new Map<string, string>();

  // create a new session for each existing tracked inventory
  for (const row of existingTracking) {
    const result = await db
      .insertInto("tracked_inventory_contribution_sessions")
      .values({
        tracked_inventory_id: row.id,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    sessionIdMap.set(row.bitcraft_inventory_id, result.id);
  }

  // backfill existing contributions to point at the new sessions
  const existingContributions = await db
    .selectFrom("tracked_inventory_contributions")
    .select(["tracked_inventory_id", "id"])
    .execute();

  for (const contrib of existingContributions) {
    const sessionId = sessionIdMap.get(contrib.tracked_inventory_id);
    if (sessionId) {
      await db
        .updateTable("tracked_inventory_contributions")
        .set({ session_id: sessionId })
        .where("id", "=", contrib.id)
        .execute();
    } else {
      throw new Error(
        `Missing sessionId for contribution with inventory ID ${contrib.tracked_inventory_id}`,
      );
    }
  }

  await db.schema
    .alterTable("tracked_inventory_contributions")
    .alterColumn("session_id", (c) => c.setNotNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("tracked_inventory_contributions")
    .dropColumn("session_id")
    .execute();

  await db.schema
    .dropTable("tracked_inventory_contribution_sessions")
    .execute();

  await db.schema
    .alterTable("tracked_inventories")
    .dropColumn("discord_server_id")
    .execute();

  // This is missing in your down()
  await db.schema
    .alterTable("tracked_inventory_requests")
    .dropColumn("discord_server_id")
    .execute();
}
