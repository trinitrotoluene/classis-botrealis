/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { sql } from "kysely";

interface Args {
  empireId: string;
}

interface Result {
  results: Array<{
    serverId: string;
    threadId: string;
  }>;
}

export default class GetAllEmpireObservationThreadsQuery extends CommandBase<
  Args,
  Result
> {
  async execute() {
    const queryResults = await db
      .selectFrom("server_config")
      .selectAll()
      .where("observing_empire_logs_thread_id", "is not", null)
      .where(
        sql<boolean>`${this.args.empireId} = ANY(observing_empire_ids) OR '*' = ANY(observing_empire_ids)`
      )
      .execute();

    return {
      results: queryResults.map((x) => ({
        serverId: x.id,
        threadId: x.observing_empire_logs_thread_id!,
      })),
    };
  }
}
