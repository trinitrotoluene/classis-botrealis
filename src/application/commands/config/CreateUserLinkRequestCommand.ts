import { Temporal } from "@js-temporal/polyfill";
import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";
import { customAlphabet } from "nanoid";

interface Args {
  discord_user_id: string;
}

interface Response {
  otp: string;
  otpExpiryDate: Date;
}

const OTP_LEN = 6;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const alphabetSet = new Set(alphabet);

const generateOtp = customAlphabet(alphabet, OTP_LEN);

export function validateOtp(otp: string) {
  return otp.length === OTP_LEN && [...otp].every((c) => alphabetSet.has(c));
}

export default class CreateUserLinkRequestCommand extends CommandBase<
  Args,
  Response
> {
  async execute() {
    logger.info({ args: this.args }, "Creating user link request");
    // you can only have 1 link request in flight at a time
    await db
      .deleteFrom("user_link_requests")
      .where("discord_user_id", "=", this.args.discord_user_id)
      .execute();

    const otp = generateOtp();
    const otpExpiry = Temporal.Now.zonedDateTimeISO().add({ minutes: 20 });
    const otpExpiryDate = new Date(otpExpiry.toInstant().epochMilliseconds);

    await db
      .insertInto("user_link_requests")
      .values({
        discord_user_id: this.args.discord_user_id,
        link_token: otp,
        link_token_expires_at: otpExpiryDate,
      })
      .execute();

    return {
      otp,
      otpExpiryDate,
    };
  }
}
