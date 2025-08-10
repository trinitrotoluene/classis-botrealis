/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericContainer, Wait } from "testcontainers";
import { execSync } from "child_process";
import { Config } from "@src/config";
import { logger } from "@src/logger";

process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

logger.info("Starting database container");
// Start PostgreSQL container
const container = await new GenericContainer("postgres:13")
  .withEnvironment({
    POSTGRES_USER: Config.postgres.user,
    POSTGRES_PASSWORD: Config.postgres.password,
    POSTGRES_DB: Config.postgres.database,
  })
  .withExposedPorts(5432)
  .withWaitStrategy(Wait.forListeningPorts())
  .withStartupTimeout(30_000)
  .start();

logger.info("Started");
try {
  const port = container.getMappedPort(5432);
  const host = container.getHost();
  const connectionString = `postgres://${Config.postgres.user}:${Config.postgres.password}@${host}:${port}/${Config.postgres.database}`;

  // Override connection details before migrateToLatest imports the kysely driver instance
  (process.env as any).OVERRIDE_PG_PORT = port;
  (process.env as any).OVERRIDE_PG_HOST = host;

  // Apply migrations to the in-memory database
  await import("./migrateToLatest");

  logger.info("Generating types");
  // Set up env for Kanel and run
  process.env.DATABASE_URL = connectionString;
  execSync(`pnpx kanel --config ./.kanelrc.cjs`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
} finally {
  logger.info("Stopping");
  // Importing database the first time implicitly attempts a connection
  // so we cannot import it before the container has started up.
  const { db } = await import("src/database");
  await db.destroy();
  await container.stop();
  logger.info("Stopped");
}
