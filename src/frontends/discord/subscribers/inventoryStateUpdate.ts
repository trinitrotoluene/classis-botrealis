import GetChannelsLinkedToInventoryQuery from "@src/application/queries/bitcraft/GetChannelsLinkedToInventoryQuery";
import GetInventoryStateChangeInfoQuery, {
  type Response,
} from "@src/application/queries/bitcraft/GetInventoryStateChangeInfoQuery";
import { CommandBus, QueryBus } from "@src/framework";
import type { BitcraftInventoryState, IEventContext } from "@src/vela";
import { ContainerBuilder, MessageFlags } from "discord.js";
import { DiscordBot } from "../bot";
import CompleteInventoryLinkRequestCommand from "@src/application/commands/config/CompleteInventoryLinkRequestCommand";
import PushToContributionLogCommand from "@src/application/commands/bitcraft/PushToContributionLogCommand";

export async function onInventoryStateUpdate(
  ctx: IEventContext,
  oldState: BitcraftInventoryState,
  newState: BitcraftInventoryState,
) {
  const diffResponse = await CommandBus.execute(
    new GetInventoryStateChangeInfoQuery({ oldState, newState }),
  );

  // If we weren't able to diff the inventory we can exit early.
  if (!diffResponse.ok) {
    return;
  }

  // If the player was just moving items around we can also exit early.
  const { diff, newState: inventoryState } = diffResponse.data;
  if (diff.size < 1) {
    return;
  }

  // If we have player information available, run this command to complete any pending
  // inventory link requests.
  if (ctx.player) {
    await CommandBus.execute(
      new CompleteInventoryLinkRequestCommand({
        bitcraftInventoryId: newState.Id,
        bitcraftUserId: ctx.player.Id,
      }),
    );
  }

  const getTrackedInventoriesResponse = await QueryBus.execute(
    new GetChannelsLinkedToInventoryQuery({
      inventoryId: newState.Id,
    }),
  );

  if (!getTrackedInventoriesResponse.ok) {
    return;
  }

  // Nobody cares about this inventory? Exit early.
  if (getTrackedInventoriesResponse.data.length === 0) {
    return;
  }

  // Log contributions to the DB before notifying the channel.
  for (const change of diff.values()) {
    await CommandBus.execute(
      new PushToContributionLogCommand({
        bitcraftPlayerId: ctx.player?.Id,
        inventoryId: newState.Id,
        itemId: change.itemId,
        change: change.diff,
      }),
    );
  }

  // Push to all subscribed channels
  await Promise.allSettled(
    getTrackedInventoriesResponse.data.map((x) =>
      notifyTrackingChannels(
        ctx,
        x.name,
        x.channelId,
        x.messageId,
        inventoryState,
        diff,
      ),
    ),
  );
}

async function notifyTrackingChannels(
  ctx: IEventContext,
  inventoryName: string,
  channelId: string,
  messageId: string,
  inventoryState: Response["newState"],
  diff: Response["diff"],
) {
  const heading = `## Tracking: ${inventoryName}`;
  const currentStateDisplay = Array.from(
    inventoryState.values().map((data) => {
      return `\`${data.quantity.toString().padEnd(5, " ")} T${data.tier ?? "?"} ${data.name ?? data.id} ${data.rarity !== "Common" ? "" : (data.rarity ?? "n/a")}\``;
    }),
  ).join("\n");

  const playerName = ctx.player?.Username ?? ctx.player?.Id ?? "Unknown";
  const diffDisplay = Array.from(
    diff.values().map((data) => {
      return `${data.diff >= 0 ? `➡️ **${playerName}** added` : `↩️ **${playerName}** withdrew`} ${Math.abs(data.diff)} T${data.item?.tier ?? "?"} ${data.item?.name ?? data.itemId} ${data.item?.rarity !== "Common" ? "" : (data.item?.rarity ?? "n/a")}`;
    }),
  ).join("\n");

  const replacementContainer = new ContainerBuilder().addTextDisplayComponents(
    (c) => c.setContent(`${heading}\n${currentStateDisplay}`),
  );

  const logContainer = new ContainerBuilder().addTextDisplayComponents((c) =>
    c.setContent(diffDisplay),
  );

  const targetChannel = await DiscordBot.channels.fetch(channelId);
  if (!targetChannel?.isSendable()) {
    return;
  }

  const message = await targetChannel.messages.fetch(messageId);
  await message.edit({
    components: [replacementContainer],
    flags: MessageFlags.IsComponentsV2,
  });

  await targetChannel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
  });
}
