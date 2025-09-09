import { db } from "@src/database";
import type { UserLinksBitcraftUserId } from "@src/database/__generated__/public/UserLinks";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";

type Args = { id: string; discordUserId: string };
type Response = object;

export default class DeleteUserLinkCommand extends CommandBase<Args, Response> {
  async execute() {
    logger.info("Deleting user link", { args: this.args });
    await db
      .deleteFrom("user_links")
      .where("discord_user_id", "=", this.args.discordUserId)
      .where("bitcraft_user_id", "=", this.args.id as UserLinksBitcraftUserId)
      .executeTakeFirstOrThrow();
  }
}
