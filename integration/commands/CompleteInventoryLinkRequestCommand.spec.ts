/* eslint-disable @typescript-eslint/no-explicit-any */
import CompleteInventoryLinkRequestCommand from "@src/application/commands/config/CompleteInventoryLinkRequestCommand";
import { db } from "@src/database";
import type { TrackedInventoryRequestsId } from "@src/database/__generated__/public/TrackedInventoryRequests";
import { CommandBus } from "@src/framework";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("CreateUserLinkRequestCommand", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2020-01-02T00:00:00Z") });
  });

  afterEach(async () => {
    vi.useRealTimers();

    await db.deleteFrom("user_link_requests").execute();
    await db.deleteFrom("user_links").execute();
  });

  it("completes an in flight request for a player", async () => {
    await db
      .insertInto("tracked_inventory_requests")
      .values([
        {
          id: "1" as TrackedInventoryRequestsId,
          name: "cool stall 1",
          creator_discord_id: "1",
          creator_bitcraft_id: "bitcraft-user-1",
          target_channel_id: "111",
          status_message_id: "1111",
          discord_server_id: "discord-server-id",
        },
        {
          id: "2" as TrackedInventoryRequestsId,
          name: "cool stall 2",
          creator_discord_id: "2",
          creator_bitcraft_id: "22",
          target_channel_id: "222",
          status_message_id: "2222",
          discord_server_id: "discord-server-id",
        },
      ])
      .execute();

    const result: any = await CommandBus.execute(
      new CompleteInventoryLinkRequestCommand({
        bitcraftInventoryId: "abc123",
        bitcraftUserId: "bitcraft-user-1",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ targetChannelId: "111" });

    const requests = await db
      .selectFrom("tracked_inventory_requests")
      .select("id")
      .execute();

    // request with id 1 was removed
    expect(requests).toEqual([{ id: "2" }]);

    const links = await db
      .selectFrom("tracked_inventories")
      .selectAll()
      .execute();

    expect(links).toEqual([
      {
        bitcraft_inventory_id: "abc123",
        creator_bitcraft_id: "bitcraft-user-1",
        creator_discord_id: "1",
        id: "1",
        name: "cool stall 1",
        target_channel_id: "111",
        status_message_id: "1111",
        discord_server_id: "discord-server-id",
      },
    ]);

    const sessions = await db
      .selectFrom("tracked_inventory_contribution_sessions")
      .selectAll()
      .execute();

    expect(sessions).toEqual([
      {
        id: "1",
      },
    ]);
  });
});
