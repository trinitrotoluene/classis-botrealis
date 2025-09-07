import { db } from "@src/database";
import type { TrackedInventoriesId } from "@src/database/__generated__/public/TrackedInventories";
import { CommandBase } from "@src/framework";

type Args = {
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
    return db
      .insertInto("tracked_inventory_contributions")
      .values({
        tracked_inventory_id: this.args.inventoryId as TrackedInventoriesId,
        change: this.args.change,
        item_id: this.args.itemId,
        bitcraft_user_id: this.args.bitcraftPlayerId,
      })
      .execute();
  }
}
