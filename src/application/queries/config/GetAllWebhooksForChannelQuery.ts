/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { filterAsync } from "@src/application/utils/filterAsync";
import { getServerModule } from "@src/application/utils/getServerModule";
import { db } from "@src/database";
import { ChannelId, CommandBase } from "@src/framework";

interface Args {
  channelId: ChannelId;
  module: string;
}

interface Result {
  results: Array<{
    webhookId: string;
    webhookToken: string;
  }>;
}

export default class GetAllWebhooksForChannelQuery extends CommandBase<
  Args,
  Result
> {
  async execute() {
    const results = await getAllWebhookConfigsForChannel(
      this.args.module,
      this.args.channelId,
    );
    return {
      results,
    };
  }
}

async function getAllWebhookConfigsForChannel(
  sourceModule: string,
  channelId: ChannelId,
) {
  const queryBuilder = db.selectFrom("server_config");

  switch (channelId) {
    case ChannelId.Region: {
      const results = await queryBuilder
        .selectAll()
        .where("live_region_chat_webhook_id", "is not", null)
        .where("live_region_chat_webhook_token", "is not", null)
        .execute();

      const filteredResults = await filterAsync(results, async (row) => {
        const module = await getServerModule(row.linked_claim_id);
        return module === sourceModule;
      });

      return filteredResults.map((row) => ({
        webhookId: row.live_region_chat_webhook_id!,
        webhookToken: row.live_region_chat_webhook_token!,
      }));
    }
    case ChannelId.Empire: {
      const results = await queryBuilder
        .selectAll()
        .where("live_empire_chat_webhook_id", "is not", null)
        .where("live_empire_chat_webhook_token", "is not", null)
        .execute();

      const filteredResults = await filterAsync(results, async (row) => {
        const module = await getServerModule(row.linked_claim_id);
        return module === sourceModule;
      });

      return filteredResults.map((row) => ({
        webhookId: row.live_empire_chat_webhook_id!,
        webhookToken: row.live_empire_chat_webhook_token!,
      }));
    }
    case ChannelId.Local: {
      const results = await queryBuilder
        .selectAll()
        .where("live_local_chat_webhook_id", "is not", null)
        .where("live_local_chat_webhook_token", "is not", null)
        .execute();

      const filteredResults = await filterAsync(results, async (row) => {
        const module = await getServerModule(row.linked_claim_id);
        return module === sourceModule;
      });

      return filteredResults.map((row) => ({
        webhookId: row.live_local_chat_webhook_id!,
        webhookToken: row.live_local_chat_webhook_token!,
      }));
    }
    default:
      return [];
  }
}
