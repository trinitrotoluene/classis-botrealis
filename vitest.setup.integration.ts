/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericContainer, Wait } from "testcontainers";
import { beforeEach, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { Config } from "./src/config";
import { readFileSync } from "fs";

let client: Client;

// Load integration test specific environment variables
const envPath = resolve(__dirname, "./.env.integrationtests");
config({ path: envPath });

console.log("Starting PostgreSQL container for integration tests...");
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

console.log("PostgreSQL container started");
console.log("Connecting to PostgreSQL...");

const port = container.getMappedPort(5432);
const host = container.getHost();

(process.env as any).OVERRIDE_PG_PORT = port;
(process.env as any).OVERRIDE_PG_HOST = host;

beforeAll(async () => {
  client = new Client({
    connectionString: `postgres://${Config.postgres.user}:${Config.postgres.password}@${host}:${port}/${Config.postgres.database}`,
  });
  await client.connect();

  (globalThis as Record<string, unknown>).pgClient = client;

  // Simply importing this file causes the migrations to run.
  // We cannot pre-import it because obviously there's nothing to migrate before this point.
  await import("./src/database/__meta__/migrateToLatest");

  console.log("Reading test data files");
  const recipes = readFileSync("./integration/test-data/recipes.sql", "utf-8");
  const items = readFileSync("./integration/test-data/items.sql", "utf-8");

  console.log("Executing test data queries");
  await client.query(items);
  await client.query(recipes);
}, 60_000);

afterAll(async () => {
  console.log("Closing PostgreSQL client...");
  client?.end();
  console.log("Stopping PostgreSQL container...");
  container?.stop();
  console.log("Stopped");
});

beforeEach(async () => {
  await client.query("DELETE FROM server_config");
});
