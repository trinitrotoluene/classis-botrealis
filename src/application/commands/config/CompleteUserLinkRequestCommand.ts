import { db } from "@src/database";
import type { UserLinksBitcraftUserId } from "@src/database/__generated__/public/UserLinks";
import { ChannelId, CommandBase } from "@src/framework";
import type { BitcraftChatMessage } from "@src/vela";
import { validateOtp } from "./CreateUserLinkRequestCommand";
import { logger } from "@src/logger";

type Args = Pick<
  BitcraftChatMessage,
  "ChannelId" | "Content" | "SenderId" | "SenderUsername"
>;

interface Response {
  discordUserId: string;
  bitcraftUsername: string;
  bitcraftUserId: string;
}

export default class CompleteUserLinkRequestCommand extends CommandBase<
  Args,
  Response | null
> {
  async execute() {
    if (this.args.ChannelId !== ChannelId.Local) {
      return null;
    }

    const otp = this.args.Content.trim();
    if (!validateOtp(otp)) {
      return null;
    }

    // get all user link requests with this OTP that have not expired
    const linkRequests = await db
      .selectFrom("user_link_requests")
      .selectAll()
      .where("link_token", "=", otp)
      .where("link_token_expires_at", ">", new Date())
      .execute();

    // duplicates are extremely unlikely, but we should treat these as invalid
    // and obviously if the code doesn't exist at all it should also be treated as invalid
    if (linkRequests.length !== 1) {
      throw new Error("Invalid OTP code provided");
    }

    const linkRequest = linkRequests[0];
    logger.info(
      { args: this.args, linkRequest },
      "Completing user link request",
    );

    return db.transaction().execute(async (txn) => {
      await txn
        .deleteFrom("user_link_requests")
        .where("id", "=", linkRequest.id)
        .execute();

      await txn
        .insertInto("user_links")
        .values({
          discord_user_id: linkRequest.discord_user_id,
          bitcraft_user_id: this.args.SenderId as UserLinksBitcraftUserId,
          is_primary_account: false, // not currently in use
        })
        .execute();

      logger.info({ linkRequest }, "User linked successfully");

      return {
        outcome: "Linked" as const,
        discordUserId: linkRequest.discord_user_id,
        bitcraftUserId: this.args.SenderId,
        bitcraftUsername: this.args.SenderUsername,
      };
    });
  }
}
