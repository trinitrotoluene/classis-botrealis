import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import { db } from "@src/database";
import type { ServerConfigId } from "@src/database/__generated__/public/ServerConfig";
import { describe, expect, it } from "vitest";

describe("GetAllEmpireObservationThreadsQuery", () => {
  it("Correctly filters multiple configs to return the rows of interest", async () => {
    await db
      .insertInto("server_config")
      .values([
        {
          id: "server-1" as ServerConfigId,
          observing_empire_logs_thread_id: "thread-1",
          observing_empire_ids: ["empire-1"],
        },
        {
          id: "server-2" as ServerConfigId,
          observing_empire_logs_thread_id: "thread-2",
          observing_empire_ids: ["empire-2"],
        },
        {
          id: "server-3" as ServerConfigId,
          observing_empire_ids: ["empire-1"],
        },
        {
          id: "server-4" as ServerConfigId,
          observing_empire_ids: ["*"],
          observing_empire_logs_thread_id: "thread-4",
        },
      ])
      .execute();

    const query = new GetAllEmpireObservationThreadsQuery({
      empireId: "empire-1",
    });
    const result = await query.execute();

    expect(result).toEqual({
      results: [
        { serverId: "server-1", threadId: "thread-1" },
        { serverId: "server-4", threadId: "thread-4" },
      ],
    });
  });
});
