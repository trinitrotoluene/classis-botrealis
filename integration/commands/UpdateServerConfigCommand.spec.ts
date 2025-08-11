import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import { db } from "@src/database";
import type { ServerConfigId } from "@src/database/__generated__/public/ServerConfig";
import { describe, expect, it } from "vitest";

describe("UpdateServerConfigCommand", () => {
  it("inserts a new config if none exists", async () => {
    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      claimId: "cool-claim-id",
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        linked_claim_id: "cool-claim-id",
      }),
    ]);
  });

  it("updates linked_claim_id when re-run with a provided claimId for a server with no existing config", async () => {
    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      claimId: "cool-claim-id",
    });

    await command.execute();
    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        linked_claim_id: "cool-claim-id",
      }),
    ]);
  });

  it("updates shared_craft_thread_id when re-run with a provided thread ID for a server with no existing config", async () => {
    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      sharedCraftThreadId: "cool-thread-id",
    });

    await command.execute();
    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        shared_craft_thread_id: "cool-thread-id",
      }),
    ]);
  });

  it.each([
    ["live_region_chat_webhook_id", "liveRegionChatWebhookId"],
    ["live_region_chat_webhook_token", "liveRegionChatWebhookToken"],
    ["live_empire_chat_webhook_id", "liveEmpireChatWebhookId"],
    ["live_empire_chat_webhook_token", "liveEmpireChatWebhookToken"],
    ["live_local_chat_webhook_id", "liveLocalChatWebhookId"],
    ["live_local_chat_webhook_token", "liveLocalChatWebhookToken"],
  ] as const)(
    "webhook configs: updates %s when re-run with a provided %s for a server with existing config",
    async (dbPropName, commandArgName) => {
      await db
        .insertInto("server_config")
        .values({
          id: "cool-server-id" as ServerConfigId,
          [dbPropName]: "cool-property-value",
        })
        .execute();

      const command = new UpdateServerConfigCommand({
        serverId: "cool-server-id",
        webhooks: {
          [commandArgName]: "new-property-value",
        },
      });

      await command.execute();

      const serverConfigs = await db
        .selectFrom("server_config")
        .selectAll()
        .execute();

      expect(serverConfigs).toEqual([
        expect.objectContaining({
          id: "cool-server-id",
          [dbPropName]: "new-property-value",
        }),
      ]);
    }
  );

  it("updates linked_claim_id when re-run with a provided claimId for a server with existing config", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        linked_claim_id: "old-claim-id",
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      claimId: "new-claim-id",
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        linked_claim_id: "new-claim-id",
      }),
    ]);
  });

  it("updates shared_craft_thread_id when re-run with a provided thread ID for a server with existing config", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        shared_craft_thread_id: "old-thread-id",
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      sharedCraftThreadId: "new-thread-id",
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        shared_craft_thread_id: "new-thread-id",
      }),
    ]);
  });

  it.each([
    ["live_region_chat_webhook_id", "liveRegionChatWebhookId"],
    ["live_region_chat_webhook_token", "liveRegionChatWebhookToken"],
    ["live_empire_chat_webhook_id", "liveEmpireChatWebhookId"],
    ["live_empire_chat_webhook_token", "liveEmpireChatWebhookToken"],
    ["live_local_chat_webhook_id", "liveLocalChatWebhookId"],
    ["live_local_chat_webhook_token", "liveLocalChatWebhookToken"],
  ] as const)(
    "webhook configs: un-sets %s when re-run with a provided %s for a server with existing config",
    async (dbPropName, commandArgName) => {
      await db
        .insertInto("server_config")
        .values({
          id: "cool-server-id" as ServerConfigId,
          [dbPropName]: "cool-property-value",
        })
        .execute();

      const command = new UpdateServerConfigCommand({
        serverId: "cool-server-id",
        webhooks: {
          [commandArgName]: null,
        },
      });

      await command.execute();

      const serverConfigs = await db
        .selectFrom("server_config")
        .selectAll()
        .execute();

      expect(serverConfigs).toEqual([
        expect.objectContaining({
          id: "cool-server-id",
          [dbPropName]: null,
        }),
      ]);
    }
  );
});
