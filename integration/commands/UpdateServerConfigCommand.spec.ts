import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import { db } from "@src/database";
import type { ServerConfigId } from "@src/database/__generated__/public/ServerConfig";
import ServerFeature from "@src/database/__generated__/public/ServerFeature";
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

  it("enables new features", async () => {
    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      addFeatures: [
        ServerFeature.manage_projects,
        ServerFeature.observe_empires,
      ],
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        features_enabled: [
          ServerFeature.manage_projects,
          ServerFeature.observe_empires,
        ],
      }),
    ]);
  });

  it("disables a feature", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        features_enabled: [
          ServerFeature.manage_projects,
          ServerFeature.observe_empires,
        ],
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      removeFeatures: [ServerFeature.observe_empires],
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        features_enabled: [ServerFeature.manage_projects],
      }),
    ]);
  });

  it("enables a feature", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        features_enabled: [ServerFeature.manage_projects],
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      addFeatures: [ServerFeature.observe_empires],
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        features_enabled: [
          ServerFeature.manage_projects,
          ServerFeature.observe_empires,
        ],
      }),
    ]);
  });

  it("adds an observed empire", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        observing_empire_ids: ["empire-1"],
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      addObservedEmpires: ["empire-2"],
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        observing_empire_ids: ["empire-1", "empire-2"],
      }),
    ]);
  });

  it("removes an observed empire", async () => {
    await db
      .insertInto("server_config")
      .values({
        id: "cool-server-id" as ServerConfigId,
        observing_empire_ids: ["empire-1", "empire-2"],
      })
      .execute();

    const command = new UpdateServerConfigCommand({
      serverId: "cool-server-id",
      removeObservedEmpires: ["empire-2"],
    });
    await command.execute();

    const serverConfigs = await db
      .selectFrom("server_config")
      .selectAll()
      .execute();

    expect(serverConfigs).toEqual([
      expect.objectContaining({
        id: "cool-server-id",
        observing_empire_ids: ["empire-1"],
      }),
    ]);
  });

  it.each([
    ["claimId", "linked_claim_id"],
    ["sharedCraftThreadId", "shared_craft_thread_id"],
    ["observingEmpireLogsThreadId", "observing_empire_logs_thread_id"],
  ] as const)(
    "top level string configs: updates %s when run for a server with no existing config",
    async (key, dbKey) => {
      const command = new UpdateServerConfigCommand({
        serverId: "cool-server-id",
        [key]: "cool-value",
      });

      await command.execute();
      const serverConfigs = await db
        .selectFrom("server_config")
        .selectAll()
        .execute();

      expect(serverConfigs).toEqual([
        expect.objectContaining({
          id: "cool-server-id",
          [dbKey]: "cool-value",
        }),
      ]);
    },
  );

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
    },
  );

  it.each([
    ["claimId", "linked_claim_id"],
    ["sharedCraftThreadId", "shared_craft_thread_id"],
    ["observingEmpireLogsThreadId", "observing_empire_logs_thread_id"],
  ] as const)(
    "top level string configs: updates %s when run for a server with existing config",
    async (key, dbKey) => {
      await db
        .insertInto("server_config")
        .values({
          id: "cool-server-id" as ServerConfigId,
          [dbKey]: "old-value",
        })
        .execute();

      const command = new UpdateServerConfigCommand({
        serverId: "cool-server-id",
        [key]: "new-value",
      });

      await command.execute();
      const serverConfigs = await db
        .selectFrom("server_config")
        .selectAll()
        .execute();

      expect(serverConfigs).toEqual([
        expect.objectContaining({
          id: "cool-server-id",
          [dbKey]: "new-value",
        }),
      ]);
    },
  );

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
    },
  );
});
