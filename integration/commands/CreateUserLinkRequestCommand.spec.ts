import CreateUserLinkRequestCommand from "@src/application/commands/config/CreateUserLinkRequestCommand";
import { db } from "@src/database";
import { CommandBus } from "@src/framework";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("CreateUserLinkRequestCommand", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2020-01-01T00:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Inserts a new user link request, deleting any existing ones for that user", async () => {
    await db
      .insertInto("user_link_requests")
      .values([
        {
          discord_user_id: "1",
          link_token: "ABC123",
          link_token_expires_at: new Date(),
        },
        {
          discord_user_id: "2",
          link_token: "ABC123",
          link_token_expires_at: new Date(),
        },
      ])
      .execute();

    const result = await CommandBus.execute(
      new CreateUserLinkRequestCommand({ discord_user_id: "1" }),
    );

    expect(result.ok).toEqual(true);
    if (!result.ok) {
      throw new Error("result should be OK");
    }

    expect(result.data).toEqual({
      otp: expect.any(String),
      otpExpiryDate: new Date("2020-01-01T00:20:00Z"),
    });

    const requests = await db
      .selectFrom("user_link_requests")
      .selectAll()
      .execute();

    expect(requests).toEqual([
      // other user's request is not deleted
      {
        discord_user_id: "2",
        id: "2",
        link_token: "ABC123",
        link_token_expires_at: new Date("2020-01-01T00:00:00.000Z"),
      },
      // new request overwrote the in-flight one
      {
        discord_user_id: "1",
        id: "3",
        link_token: result.data.otp,
        link_token_expires_at: result.data.otpExpiryDate,
      },
    ]);
  });
});
