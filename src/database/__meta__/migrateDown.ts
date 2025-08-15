import { configureDb, migrateDown } from "../db";

await configureDb();
await migrateDown();
