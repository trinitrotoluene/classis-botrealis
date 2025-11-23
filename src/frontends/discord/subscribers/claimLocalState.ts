import type { BitcraftClaimLocalState, IEventContext } from "@src/vela";
import GetSupplyAlertChannelsQuery from "@src/application/queries/config/GetSupplyAlertChannelsQuery";
import { DiscordBot } from "../bot";
import { MessageFlags, ContainerBuilder } from "discord.js";
import { QueryBus } from "@src/framework";
import GetClaimQuery from "@src/application/queries/bitcraft/GetClaimQuery";

export async function onClaimLocalStateChanged(
  _ctx: IEventContext,
  _oldState: BitcraftClaimLocalState,
  newState: BitcraftClaimLocalState,
) {
  const claimId = newState.Id;
  const currentSupply = newState.Supplies;
  const supplyDelta = currentSupply - (_oldState?.Supplies ?? 0);
  if (supplyDelta >= 0) {
    // No supply drop, ignore
    return;
  }

  const query = new GetSupplyAlertChannelsQuery({ claimId, currentSupply });
  const channels = await QueryBus.execute(query);

  if (!channels.ok) {
    return;
  }

  const claimInfoQuery = new GetClaimQuery({ claimId: claimId });
  const claimResult = await QueryBus.execute(claimInfoQuery);

  if (!claimResult.ok) {
    return;
  }

  const builder = new ContainerBuilder();
  builder.addTextDisplayComponents((c) =>
    c.setContent(
      `Supply alert for claim ${claimResult.data?.name ?? claimId}: Current supply is ${currentSupply}.`,
    ),
  );

  await publish(
    channels.data.map((channel) => channel.channelId),
    builder,
  );
}

async function publish(channels: string[], builder: ContainerBuilder) {
  const results = await Promise.allSettled(
    channels.map((x) => DiscordBot.channels.fetch(x)),
  );

  await Promise.all(
    results.map((x) => {
      if (x.status === "rejected" || !x.value) {
        return Promise.resolve();
      }

      const channel = x.value;
      if (channel.isSendable()) {
        return channel.send({
          components: [builder],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }),
  );
}
