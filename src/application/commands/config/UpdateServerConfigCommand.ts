import { db } from "@src/database";
import type {
  NewServerConfig,
  ServerConfigId,
} from "@src/database/__generated__/public/ServerConfig";
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
}

export default class UpdateServerConfigCommand extends CommandBase<Args, void> {
  async execute() {
    const id = this.args.serverId as ServerConfigId;

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
