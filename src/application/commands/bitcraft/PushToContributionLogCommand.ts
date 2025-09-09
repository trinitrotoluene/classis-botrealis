import { db } from "@src/database";
import type { TrackedInventoriesId } from "@src/database/__generated__/public/TrackedInventories";
import type { TrackedInventoryContributionSessionsId } from "@src/database/__generated__/public/TrackedInventoryContributionSessions";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";

type Args = {
  sessionId: string;
  inventoryId: string;
  itemId: string;
  bitcraftPlayerId?: string;
  change: number;
};

type Response = object;

export default class PushToContributionLogCommand extends CommandBase<
  Args,
  Response
> {
  async execute() {
    logger.info(this.args, "Logging contribution");

    return db
      .insertInto("tracked_inventory_contributions")
      .values({
        session_id: this.args
          .sessionId as TrackedInventoryContributionSessionsId,
        tracked_inventory_id: this.args.inventoryId as TrackedInventoriesId,
        change: this.args.change,
        item_id: this.args.itemId,
        bitcraft_user_id: this.args.bitcraftPlayerId,
      })
      .execute();
  }
}
