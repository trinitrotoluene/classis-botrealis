import { Kysely, PostgresDialect } from "kysely";
import type { Database } from "./__generated__/Database";
import { pool } from "./pool";

const dialect = new PostgresDialect({
  pool,
});

export const db = new Kysely<Database>({
  dialect,
});
