import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  channelId?: string;
  serverId?: string;
};

type Response = Array<{
  trackedInventoryId: string;
  inventoryDisplayName: string;
  discordChannelId: string;
  discordMessageId: string;
  contributionSessionId: string;
  bitcraftInventoryId: string;
}>;

export default class GetLinkedInventoriesQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    if (!this.args.channelId && !this.args.serverId) {
      throw new Error("Either channelId or serverId must be provided");
    }

    let query = db.selectFrom("tracked_inventories").selectAll();
    if (this.args.channelId) {
      query = query.where("target_channel_id", "=", this.args.channelId);
    } else if (this.args.serverId) {
      query = query.where("discord_server_id", "=", this.args.serverId);
    }

    const links = await query.execute();
    return links.map((x) => ({
      trackedInventoryId: x.id,
      inventoryDisplayName: x.name,
      discordChannelId: x.target_channel_id,
      discordMessageId: x.status_message_id,
      contributionSessionId: x.id,
      bitcraftInventoryId: x.bitcraft_inventory_id,
    }));
  }
}
