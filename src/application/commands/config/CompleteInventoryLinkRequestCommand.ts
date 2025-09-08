import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  bitcraftUserId: string;
  bitcraftInventoryId: string;
};

type Response = object;

export default class CompleteInventoryLinkRequestCommand extends CommandBase<
  Args,
  Response | null
> {
  async execute() {
    // get all inventory link requests with this bitcraft user ID that have not expired
    const linkRequests = await db
      .selectFrom("tracked_inventory_requests")
      .selectAll()
      .where("creator_bitcraft_id", "=", this.args.bitcraftUserId)
      .execute();

    // duplicates are extremely unlikely, but we should treat these as invalid
    // and obviously if the code doesn't exist at all it should also be treated as invalid
    if (linkRequests.length > 1) {
      throw new Error("Ambiguous or missing inventory link requests");
    } else if (linkRequests.length === 0) {
      return {};
    }

    const linkRequest = linkRequests[0];

    await db.transaction().execute(async (txn) => {
      await txn
        .deleteFrom("tracked_inventory_requests")
        .where("id", "=", linkRequest.id)
        .execute();

      const insertResult = await txn
        .insertInto("tracked_inventories")
        .values({
          name: linkRequest.name,
          creator_discord_id: linkRequest.creator_discord_id,
          creator_bitcraft_id: linkRequest.creator_bitcraft_id,
          target_channel_id: linkRequest.target_channel_id,
          status_message_id: linkRequest.status_message_id,
          bitcraft_inventory_id: this.args.bitcraftInventoryId,
          discord_server_id: linkRequest.discord_server_id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (insertResult.id === undefined) {
        throw new Error("Failed to insert new tracked inventory");
      }

      await txn
        .insertInto("tracked_inventory_contribution_sessions")
        .values({
          tracked_inventory_id: insertResult.id,
        })
        .execute();
    });

    return {
      targetChannelId: linkRequest.target_channel_id,
    };
  }
}
