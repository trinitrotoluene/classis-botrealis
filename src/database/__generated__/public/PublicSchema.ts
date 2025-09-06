import type { default as RecipesTable } from "./Recipes";
import type { default as ItemsTable } from "./Items";
import type { default as KyselyMigrationLockTable } from "./KyselyMigrationLock";
import type { default as KyselyMigrationTable } from "./KyselyMigration";
import type { default as UserLinksTable } from "./UserLinks";
import type { default as ServerConfigTable } from "./ServerConfig";
import type { default as UserLinkRequestsTable } from "./UserLinkRequests";

export default interface PublicSchema {
  recipes: RecipesTable;

  items: ItemsTable;

  kysely_migration_lock: KyselyMigrationLockTable;

  kysely_migration: KyselyMigrationTable;

  user_links: UserLinksTable;

  server_config: ServerConfigTable;

  user_link_requests: UserLinkRequestsTable;
}
