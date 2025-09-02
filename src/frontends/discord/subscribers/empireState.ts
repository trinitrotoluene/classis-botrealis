import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import { EventAggregator, QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import { type BitcraftEmpireState } from "@src/vela";
import { ContainerBuilder, MessageFlags } from "discord.js";
import { DiscordBot } from "../bot";

const Aggregator = new EventAggregator<
  BitcraftEmpireState & { oldAmount: number; newAmount: number }
>();

export async function onEmpireStateUpdated(
  oldState: BitcraftEmpireState,
  newState: BitcraftEmpireState,
) {
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

  const sign = (n: number) => (n > 0 ? `+${n}` : n.toString());

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(`## ${events[0].Name} hexite treasury updated`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(`\`\`\`
Total shards       : ${events.slice(-1)[0]?.newAmount ?? "n/a"}
Net change         : ${sign(totalChange)}

Sum of deposits    : ${sign(totalDeposits)}
Sum of withdrawals : ${sign(totalWithdrawals)}
\`\`\`
`),
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
