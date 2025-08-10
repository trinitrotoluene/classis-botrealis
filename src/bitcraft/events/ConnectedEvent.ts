import type { Identity } from "@clockworklabs/spacetimedb-sdk";
import type { DbConnection } from "@src/bindings";

export interface IConnectedEvent {
  type: "connected";
  conn: DbConnection;
  identity: Identity;
}
