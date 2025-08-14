import { FileMigrationProvider, Migrator } from "kysely";
import { db } from "./db";
import path from "path";
import { logger } from "@src/logger";

export const migrator = new Migrator({
  db: db,
  provider: new FileMigrationProvider({
    fs: await import("fs/promises"),
    path: await import("path"),
    migrationFolder: path.join(process.cwd(), "src/__migrations__"),
  }),
});

export async function migrateToLatest() {
  logger.info("Applying migrations");

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      logger.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      logger.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    logger.error("failed to migrate");
    logger.error(error);
  }
}

export async function migrateDown() {
  logger.info("Migrating down");

  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      logger.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      logger.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    logger.error("failed to migrate");
    logger.error(error);
  }
}
