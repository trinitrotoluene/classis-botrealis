import { Config } from "@src/config";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./__generated__/Database";
import { logger } from "@src/logger";

// The OVERRIDE_PG variables are present to allow integration tests to force the driver to
// connect to the container - however the host/port are not known until the container has started so
// they cannot be preconfigured.

const effectiveHost = process.env.OVERRIDE_PG_HOST ?? Config.postgres.host;
const effectivePort = process.env.OVERRIDE_PG_PORT
  ? parseInt(process.env.OVERRIDE_PG_PORT)
  : Config.postgres.port;

logger.info(
  `Configuring database connection to ${effectiveHost}:${effectivePort}`
);

const dialect = new PostgresDialect({
  pool: new Pool({
    database: Config.postgres.database,
    host: effectiveHost,
    user: Config.postgres.user,
    password: Config.postgres.password,
    port: effectivePort,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
