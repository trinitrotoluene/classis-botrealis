/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { db } from "@src/database";
import { CommandBase } from "@src/framework";

interface Result {
  results: Array<{
    serverId: string;
    threadId: string;
  }>;
}

export default class GetAllSharedCraftThreadsQuery extends CommandBase<
  object,
  Result
> {
  async execute() {
    const queryResults = await db
      .selectFrom("server_config")
      .selectAll()
      .where("shared_craft_thread_id", "is not", null)
      .execute();

    return {
      results: queryResults.map((x) => ({
        serverId: x.id,
        threadId: x.shared_craft_thread_id!,
      })),
    };
  }
}
