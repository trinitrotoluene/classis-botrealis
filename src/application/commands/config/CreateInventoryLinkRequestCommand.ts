import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";

interface Args {
  trackedInventoryName: string;
  discordChannelId: string;
  discordMessageId: string;
  creatorDiscordId: string;
  creatorLinkedBitcraftAccountId: string;
  discordServerId: string;
}

type Response = object;

export default class CreateInventoryLinkRequestCommand extends CommandBase<
  Args,
  Response
> {
  async execute() {
    logger.info({ args: this.args }, "Creating inventory link request");
    // you can only have 1 link request in flight at a time
    await db
      .deleteFrom("tracked_inventory_requests")
      .where("creator_discord_id", "=", this.args.creatorDiscordId)
      .execute();

    await db
      .insertInto("tracked_inventory_requests")
      .values({
        status_message_id: this.args.discordMessageId,
        creator_discord_id: this.args.creatorDiscordId,
        target_channel_id: this.args.discordChannelId,
        creator_bitcraft_id: this.args.creatorLinkedBitcraftAccountId,
        name: this.args.trackedInventoryName,
        discord_server_id: this.args.discordServerId,
      })
      .execute();

    return {};
  }
}
