import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import { EventAggregator, QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import { type BitcraftEmpireState, type IEventContext } from "@src/vela";
import { ContainerBuilder, MessageFlags } from "discord.js";
import { DiscordBot } from "../bot";
import { sign } from "@src/utils/sign";

const Aggregator = new EventAggregator<
  BitcraftEmpireState & { oldAmount: number; newAmount: number }
>();

export async function onEmpireStateUpdated(
  _ctx: IEventContext,
  oldState: BitcraftEmpireState,
  newState: BitcraftEmpireState,
) {
  if (oldState.ShardTreasury === newState.ShardTreasury) {
    return;
  }

  Aggregator.push(
    newState.Id,
    {
      ...newState,
      newAmount: newState.ShardTreasury,
      oldAmount: oldState.ShardTreasury,
    },
    (events) => aggregateCallback(events),
    10,
  );
}

export async function aggregateCallback(
  events: Array<BitcraftEmpireState & { oldAmount: number; newAmount: number }>,
) {
  logger.info(`Running aggregate callback for ${events.length} events`);
  if (events.length === 0) {
    return;
  }

  const serversToNotify = await QueryBus.execute(
    new GetAllEmpireObservationThreadsQuery({
      empireId: events[0].Id,
    }),
  );

  if (!serversToNotify.ok) {
    return;
  }

  const allChanges = events.map((x) => x.newAmount - x.oldAmount);

  const totalChange = allChanges.reduce((acc, n) => acc + n, 0);

  const totalWithdrawals = allChanges
    .filter((x) => x < 0)
    .reduce((acc, n) => acc + n, 0);
  const totalDeposits = allChanges
    .filter((x) => x >= 0)
    .reduce((acc, n) => acc + n, 0);

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `## ${events[0].Name} treasury updated (${sign(totalChange)})`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `💰 ${events.slice(-1)[0]?.newAmount ?? "n/a"} shards remaining
-# deposit(${sign(totalDeposits)}) withdrawal(${sign(totalWithdrawals)})`,
      ),
    );

  const results = await Promise.allSettled(
    serversToNotify.data.results.map((x) =>
      DiscordBot.channels.fetch(x.threadId),
    ),
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
