import type { default as ServerFeature } from "./ServerFeature";
import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.server_config */
export type ServerConfigId = string & { __brand: "public.server_config" };

/** Represents the table public.server_config */
export default interface ServerConfigTable {
  id: ColumnType<ServerConfigId, ServerConfigId, ServerConfigId>;

  linked_claim_id: ColumnType<string | null, string | null, string | null>;

  live_region_chat_webhook_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  live_region_chat_webhook_token: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  live_empire_chat_webhook_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  live_empire_chat_webhook_token: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  live_local_chat_webhook_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  live_local_chat_webhook_token: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  shared_craft_thread_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;

  features_enabled: ColumnType<
    ServerFeature[] | null,
    ServerFeature[] | null,
    ServerFeature[] | null
  >;

  observing_empire_ids: ColumnType<
    string[] | null,
    string[] | null,
    string[] | null
  >;

  observing_empire_logs_thread_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;
}

export type ServerConfig = Selectable<ServerConfigTable>;

export type NewServerConfig = Insertable<ServerConfigTable>;

export type ServerConfigUpdate = Updateable<ServerConfigTable>;
