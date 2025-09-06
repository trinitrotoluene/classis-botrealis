/* eslint-disable @typescript-eslint/no-explicit-any */
import CompleteUserLinkRequestCommand from "@src/application/commands/config/CompleteUserLinkRequestCommand";
import { db } from "@src/database";
import { ChannelId, CommandBus } from "@src/framework";
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

  it("does not complete an expired request", async () => {
    await db
      .insertInto("user_link_requests")
      .values([
        {
          discord_user_id: "1",
          link_token: "ABC234",
          link_token_expires_at: new Date("2000-01-01T00:00:00Z"), // expired
        },
      ])
      .execute();

    const result: any = await CommandBus.execute(
      new CompleteUserLinkRequestCommand({
        ChannelId: ChannelId.Local,
        Content: "ABC234",
        SenderId: "bitcraft-user-id",
        SenderUsername: "cool-user",
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("does not complete a missing request", async () => {
    const result: any = await CommandBus.execute(
      new CompleteUserLinkRequestCommand({
        ChannelId: ChannelId.Local,
        Content: "NONEXISTENT",
        SenderId: "bitcraft-user-id",
        SenderUsername: "cool-user",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toBe(null);
  });

  it("does not complete requests when there are multiple valid OTP matches", async () => {
    const futureDate = new Date("2099-01-01T00:00:00Z");

    await db
      .insertInto("user_link_requests")
      .values([
        {
          discord_user_id: "1",
          link_token: "ABC234",
          link_token_expires_at: futureDate,
        },
        {
          discord_user_id: "2",
          link_token: "ABC234",
          link_token_expires_at: futureDate,
        },
      ])
      .execute();

    const result: any = await CommandBus.execute(
      new CompleteUserLinkRequestCommand({
        ChannelId: ChannelId.Local,
        Content: "ABC234",
        SenderId: "bitcraft-user-id",
        SenderUsername: "cool-user",
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("does complete requests when there are multiple OTP matches but only one is not expired", async () => {
    await db
      .insertInto("user_link_requests")
      .values([
        {
          discord_user_id: "1",
          link_token: "ABC234",
          link_token_expires_at: new Date("2000-01-01T00:00:00Z"), // expired
        },
        {
          discord_user_id: "2",
          link_token: "ABC234",
          link_token_expires_at: new Date("2099-01-01T00:00:00Z"), // valid
        },
      ])
      .execute();

    const result: any = await CommandBus.execute(
      new CompleteUserLinkRequestCommand({
        ChannelId: ChannelId.Local,
        Content: "ABC234",
        SenderId: "bitcraft-user-id",
        SenderUsername: "cool-user",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      outcome: "Linked",
      bitcraftUserId: "bitcraft-user-id",
      bitcraftUsername: "cool-user",
      discordUserId: "2",
    });
  });

  it("completes and links a valid request", async () => {
    await db
      .insertInto("user_link_requests")
      .values([
        {
          discord_user_id: "1",
          link_token: "ABC234",
          link_token_expires_at: new Date("2020-01-02T00:10:00Z"),
        },
      ])
      .execute();

    const result: any = await CommandBus.execute(
      new CompleteUserLinkRequestCommand({
        ChannelId: ChannelId.Local,
        Content: "ABC234",
        SenderId: "bitcraft-user-id",
        SenderUsername: "cool-user",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      outcome: "Linked",
      bitcraftUserId: "bitcraft-user-id",
      bitcraftUsername: "cool-user",
      discordUserId: "1",
    });

    const linkRequests = await db
      .selectFrom("user_link_requests")
      .select("id")
      .execute();

    expect(linkRequests).toEqual([]);

    const links = await db.selectFrom("user_links").selectAll().execute();
    expect(links).toEqual([
      {
        bitcraft_user_id: "bitcraft-user-id",
        discord_user_id: "1",
        is_primary_account: false,
      },
    ]);
  });
});
