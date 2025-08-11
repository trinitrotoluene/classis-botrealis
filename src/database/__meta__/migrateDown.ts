import { logger } from "@src/logger";
import { migrator } from "../migrate";

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
