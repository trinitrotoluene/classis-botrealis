import { config } from "dotenv";
import { GenericContainer, Wait } from "testcontainers";
import { Config } from "./src/config";

// Load integration test specific environment variables
const envPath = "./.env.integrationtests";
config({ path: envPath });

console.log("Starting PostgreSQL container for dev environment...");
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

Config.set("postgres.host", host);
Config.set("postgres.port", port);

process.env.OVERRIDE_PG_HOST = host;
process.env.OVERRIDE_PG_PORT = port.toString();

// Simply importing this file causes the migrations to run.
// We cannot pre-import it because obviously there's nothing to migrate before this point.
await import("./src/database/__meta__/migrateToLatest");
