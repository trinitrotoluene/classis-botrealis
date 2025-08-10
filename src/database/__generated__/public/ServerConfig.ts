import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.server_config */
export type ServerConfigId = string & { __brand: 'public.server_config' };

/** Represents the table public.server_config */
export default interface ServerConfigTable {
  id: ColumnType<ServerConfigId, ServerConfigId, ServerConfigId>;

  linked_claim_id: ColumnType<string | null, string | null, string | null>;

  live_region_chat_webhook_id: ColumnType<string | null, string | null, string | null>;

  live_region_chat_webhook_token: ColumnType<string | null, string | null, string | null>;

  live_empire_chat_webhook_id: ColumnType<string | null, string | null, string | null>;

  live_empire_chat_webhook_token: ColumnType<string | null, string | null, string | null>;

  live_local_chat_webhook_id: ColumnType<string | null, string | null, string | null>;

  live_local_chat_webhook_token: ColumnType<string | null, string | null, string | null>;
}

export type ServerConfig = Selectable<ServerConfigTable>;

export type NewServerConfig = Insertable<ServerConfigTable>;

export type ServerConfigUpdate = Updateable<ServerConfigTable>;