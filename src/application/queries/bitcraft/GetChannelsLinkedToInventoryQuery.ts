import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  inventoryId: string;
};

type Response = Array<{
  name: string;
  channelId: string;
}>;

export default class GetChannelsLinkedToInventoryQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const links = await db
      .selectFrom("tracked_inventories")
      .selectAll()
      .where("bitcraft_inventory_id", "=", this.args.inventoryId)
      .execute();

    return links.map((x) => ({
      name: x.name,
      channelId: x.target_channel_id,
      messageId: x.status_message_id,
    }));
  }
}
