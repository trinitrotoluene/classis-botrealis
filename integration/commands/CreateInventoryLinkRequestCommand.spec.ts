import CreateInventoryLinkRequestCommand from "@src/application/commands/config/CreateInventoryLinkRequestCommand";
import { db } from "@src/database";
import { CommandBus } from "@src/framework";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("CreateInventoryLinkRequestCommand", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2020-01-01T00:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Inserts a new inventory link request, deleting any existing ones for that user", async () => {
    await db
      .insertInto("tracked_inventory_requests")
      .values([
        {
          name: "cool stall 1",
          creator_discord_id: "1",
          creator_bitcraft_id: "11",
          target_channel_id: "111",
          status_message_id: "1111",
        },
        {
          name: "cool stall 2",
          creator_discord_id: "2",
          creator_bitcraft_id: "22",
          target_channel_id: "222",
          status_message_id: "2222",
        },
      ])
      .execute();

    const result = await CommandBus.execute(
      new CreateInventoryLinkRequestCommand({
        creatorDiscordId: "1",
        trackedInventoryName: "cool stall 3",
        discordChannelId: "discord-channel-id",
        creatorLinkedBitcraftAccountId: "111",
        discordMessageId: "discord-message-id",
      }),
    );

    expect(result.ok).toEqual(true);
    if (!result.ok) {
      throw new Error("result should be OK");
    }

    expect(result.data).toEqual({});

    const requests = await db
      .selectFrom("tracked_inventory_requests")
      .selectAll()
      .execute();

    expect(requests).toEqual([
      // other user's request is not deleted
      {
        creator_bitcraft_id: "22",
        creator_discord_id: "2",
        id: "2",
        name: "cool stall 2",
        target_channel_id: "222",
        status_message_id: "2222",
      },
      // other pending request is deleted
      {
        creator_bitcraft_id: "111",
        creator_discord_id: "1",
        id: "3",
        name: "cool stall 3",
        target_channel_id: "discord-channel-id",
        status_message_id: "discord-message-id",
      },
    ]);
  });
});
