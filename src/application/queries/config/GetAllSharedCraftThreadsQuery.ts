/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { filterAsync } from "@src/application/utils/filterAsync";
import { getServerModule } from "@src/application/utils/getServerModule";
import { db } from "@src/database";
import { CommandBase } from "@src/framework";

interface Result {
  results: Array<{
    serverId: string;
    threadId: string;
  }>;
}

export default class GetAllSharedCraftThreadsQuery extends CommandBase<
  { module: string | undefined },
  Result
> {
  async execute() {
    const queryResults = await db
      .selectFrom("server_config")
      .selectAll()
      .where("shared_craft_thread_id", "is not", null)
      .execute();

    const resultsInModule = await filterAsync(queryResults, async (x) => {
      const module = await getServerModule(x.linked_claim_id);
      return module === this.args.module;
    });

    return {
      results: resultsInModule.map((x) => ({
        serverId: x.id,
        threadId: x.shared_craft_thread_id!,
      })),
    };
  }
}
