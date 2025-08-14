import { db } from "@src/database";
import type {
  NewServerConfig,
  ServerConfigId,
} from "@src/database/__generated__/public/ServerConfig";
import type ServerFeature from "@src/database/__generated__/public/ServerFeature";
import { CommandBase } from "@src/framework";

interface Args {
  serverId: string;
  claimId?: string | null;
  webhooks?: {
    liveRegionChatWebhookId?: string | null;
    liveRegionChatWebhookToken?: string | null;
    liveEmpireChatWebhookId?: string | null;
    liveEmpireChatWebhookToken?: string | null;
    liveLocalChatWebhookId?: string | null;
    liveLocalChatWebhookToken?: string | null;
  };
  sharedCraftThreadId?: string | null;
  observingEmpireLogsThreadId?: string | null;
  addFeatures?: Array<ServerFeature>;
  removeFeatures?: Array<ServerFeature>;
  addObservedEmpires?: Array<string>;
  removeObservedEmpires?: Array<string>;
}

export default class UpdateServerConfigCommand extends CommandBase<Args, void> {
  async execute() {
    const id = this.args.serverId as ServerConfigId;

    const existing = await db
      .selectFrom("server_config")
      .select("features_enabled")
      .select("observing_empire_ids")
      .where("id", "=", this.args.serverId as ServerConfigId)
      .executeTakeFirst();

    const newConfig: NewServerConfig = {
      id,
    };

    if (this.args.claimId !== undefined) {
      newConfig.linked_claim_id = this.args.claimId;
    }

    if (this.args.webhooks) {
      const {
        liveRegionChatWebhookId,
        liveRegionChatWebhookToken,
        liveEmpireChatWebhookId,
        liveEmpireChatWebhookToken,
        liveLocalChatWebhookId,
        liveLocalChatWebhookToken,
      } = this.args.webhooks;

      if (liveRegionChatWebhookId !== undefined) {
        newConfig.live_region_chat_webhook_id = liveRegionChatWebhookId;
      }

      if (liveRegionChatWebhookToken !== undefined) {
        newConfig.live_region_chat_webhook_token = liveRegionChatWebhookToken;
      }

      if (liveEmpireChatWebhookId !== undefined) {
        newConfig.live_empire_chat_webhook_id = liveEmpireChatWebhookId;
      }

      if (liveEmpireChatWebhookToken !== undefined) {
        newConfig.live_empire_chat_webhook_token = liveEmpireChatWebhookToken;
      }

      if (liveLocalChatWebhookId !== undefined) {
        newConfig.live_local_chat_webhook_id = liveLocalChatWebhookId;
      }

      if (liveLocalChatWebhookToken !== undefined) {
        newConfig.live_local_chat_webhook_token = liveLocalChatWebhookToken;
      }
    }

    if (this.args.sharedCraftThreadId !== undefined) {
      newConfig.shared_craft_thread_id = this.args.sharedCraftThreadId;
    }

    if (this.args.observingEmpireLogsThreadId !== undefined) {
      newConfig.observing_empire_logs_thread_id =
        this.args.observingEmpireLogsThreadId;
    }

    if (this.args.addFeatures || this.args.removeFeatures) {
      const currentFeatures = new Set<ServerFeature>(
        existing?.features_enabled ?? []
      );

      for (const featureToRemove of this.args.removeFeatures ?? []) {
        currentFeatures.delete(featureToRemove);
      }

      for (const featureToAdd of this.args.addFeatures ?? []) {
        currentFeatures.add(featureToAdd);
      }

      newConfig.features_enabled = currentFeatures.values().toArray();
    }

    if (this.args.addObservedEmpires || this.args.removeObservedEmpires) {
      const currentIds = new Set(existing?.observing_empire_ids ?? []);
      for (const id of this.args.removeObservedEmpires ?? []) {
        currentIds.delete(id);
      }

      for (const id of this.args.addObservedEmpires ?? []) {
        currentIds.add(id);
      }

      newConfig.observing_empire_ids = currentIds.values().toArray();
    }

    await db
      .insertInto("server_config")
      .values(newConfig)
      .onConflict((c) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rest } = newConfig;
        return c.column("id").doUpdateSet(rest);
      })
      .execute();
  }
}
