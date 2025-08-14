import { Kysely, PostgresDialect } from "kysely";
import type { Database } from "./__generated__/Database";
import type PublicSchema from "./__generated__/public/PublicSchema";
import { Config } from "@src/config";
import { Pool, types as pgTypes } from "pg";
import parsePgArray from "postgres-array";
import { logger } from "@src/logger";

// The OVERRIDE_PG variables are present to allow integration tests to force the driver to
// connect to the container - however the host/port are not known until the container has started so
// they cannot be preconfigured.
const effectiveHost = process.env.OVERRIDE_PG_HOST ?? Config.postgres.host;
const effectivePort = process.env.OVERRIDE_PG_PORT
  ? parseInt(process.env.OVERRIDE_PG_PORT)
  : Config.postgres.port;

export let db: Kysely<PublicSchema> =
  undefined as unknown as Kysely<PublicSchema>;

export let pool: Pool = undefined as unknown as Pool;

export async function configureDb() {
  pool = new Pool({
    database: Config.postgres.database,
    host: effectiveHost,
    user: Config.postgres.user,
    password: Config.postgres.password,
    port: effectivePort,
  });

  const dialect = new PostgresDialect({
    pool,
  });

  db = new Kysely<Database>({
    dialect,
  });
}

export async function setupEnumArrayParsers() {
  const client = await pool.connect();

  try {
    // Find all enum array types and their OIDs
    const result = await client.query(`
      SELECT t.typname AS enum_array_type, t.oid
      FROM pg_type t
      JOIN pg_type base ON t.typelem = base.oid
      WHERE t.typtype = 'b' -- base type
        AND base.typtype = 'e' -- enum base
        AND t.typcategory = 'A' -- array type
    `);

    for (const row of result.rows) {
      const oid = row.oid;
      const name = row.enum_array_type;

      pgTypes.setTypeParser(oid, parsePgArray.parse);
      logger.info(
        `Registered array parser for enum array type '${name}' (OID: ${oid})`
      );
    }
  } finally {
    client.release();
  }
}
