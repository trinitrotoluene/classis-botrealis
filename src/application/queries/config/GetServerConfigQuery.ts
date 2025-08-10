import { db } from "@src/database";
import type { ServerConfigId } from "@src/database/__generated__/public/ServerConfig";
import { CommandBase } from "@src/framework";

interface Args {
  serverId: string;
}

interface Result {
  linkedClaimId?: string;
  webhooks: {
    liveRegionChatWebhookId?: string;
    liveRegionChatWebhookToken?: string;
    liveEmpireChatWebhookId?: string;
    liveEmpireChatWebhookToken?: string;
    liveLocalChatWebhookId?: string;
    liveLocalChatWebhookToken?: string;
  };
}

export default class GetServerConfigQuery extends CommandBase<Args, Result> {
  async execute() {
    const config = await db
      .selectFrom("server_config")
      .selectAll()
      .where("id", "=", this.args.serverId as ServerConfigId)
      .executeTakeFirst();

    return {
      linkedClaimId: config?.linked_claim_id ?? undefined,
      webhooks: {
        liveRegionChatWebhookId:
          config?.live_region_chat_webhook_id ?? undefined,
        liveRegionChatWebhookToken:
          config?.live_region_chat_webhook_token ?? undefined,
        liveEmpireChatWebhookId:
          config?.live_empire_chat_webhook_id ?? undefined,
        liveEmpireChatWebhookToken:
          config?.live_empire_chat_webhook_token ?? undefined,
        liveLocalChatWebhookId: config?.live_local_chat_webhook_id ?? undefined,
        liveLocalChatWebhookToken:
          config?.live_local_chat_webhook_token ?? undefined,
      },
    };
  }
}
