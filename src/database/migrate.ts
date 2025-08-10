import { FileMigrationProvider, Migrator } from "kysely";
import { db } from ".";
import path from "path";

export const migrator = new Migrator({
  db: db,
  provider: new FileMigrationProvider({
    fs: await import("fs/promises"),
    path: await import("path"),
    migrationFolder: path.join(process.cwd(), "src/__migrations__"),
  }),
});
