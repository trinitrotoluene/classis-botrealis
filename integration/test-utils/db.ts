import { Client } from "pg";

export function getPg(): Client {
  const client = (globalThis as Record<string, unknown>).pgClient as Client | undefined;

  if (!client) {
    throw new Error(
      "PostgreSQL client is not initialized. Ensure the integration test setup is complete."
    );
  }

  return client;
}
