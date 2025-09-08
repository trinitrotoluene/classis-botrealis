import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  inventoryId: string;
};

type Response = Array<{
  inventoryDisplayName: string;
  discordChannelId: string;
  contributionSessionId: string;
}>;

export default class GetChannelsLinkedToInventoryQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const links = await db
      .selectFrom("tracked_inventories")
      .innerJoin(
        "tracked_inventory_contribution_sessions",
        "tracked_inventory_contribution_sessions.tracked_inventory_id",
        "tracked_inventories.id",
      )
      .selectAll("tracked_inventories")
      .select(["tracked_inventory_contribution_sessions.id as session_id"])
      .where("bitcraft_inventory_id", "=", this.args.inventoryId)
      .execute();

    return links.map((x) => ({
      inventoryDisplayName: x.name,
      discordChannelId: x.target_channel_id,
      discordMessageId: x.status_message_id,
      contributionSessionId: x.session_id,
    }));
  }
}
