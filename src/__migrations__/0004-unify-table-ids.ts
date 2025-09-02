/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE recipes ALTER COLUMN id TYPE TEXT USING id::TEXT`.execute(
    db,
  );

  await sql`ALTER TABLE items ALTER COLUMN id TYPE TEXT USING id::TEXT`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE recipes ALTER COLUMN id TYPE BIGINT USING id::BIGINT`.execute(
    db,
  );
  await sql`ALTER TABLE items ALTER COLUMN id TYPE BIGINT USING id::BIGINT`.execute(
    db,
  );
}
