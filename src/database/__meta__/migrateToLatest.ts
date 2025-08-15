import { configureDb, migrateToLatest } from "../db";
await configureDb();
await migrateToLatest();
