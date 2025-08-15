import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import {
  EventAggregator,
  QueryBus,
  type IApplicationEmpireTreasuryUpdated,
} from "@src/framework";
import { logger } from "@src/logger";
import { ContainerBuilder, MessageFlags, type Client } from "discord.js";

const Aggregator = new EventAggregator<IApplicationEmpireTreasuryUpdated>();

export async function onApplicationEmpireTreasuryChanged(
  client: Client,
  event: IApplicationEmpireTreasuryUpdated
) {
  Aggregator.push(
    event.empire.id,
    event,
    (events) => aggregateCallback(client, events),
    10
  );
}

export async function aggregateCallback(
  client: Client,
  events: IApplicationEmpireTreasuryUpdated[]
) {
  logger.info(`Running aggregate callback for ${events.length} events`);
  if (events.length === 0) {
    return;
  }

  const serversToNotify = await QueryBus.execute(
    new GetAllEmpireObservationThreadsQuery({
      empireId: events[0].empire.id,
    })
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
      c.setContent(`## ${events[0].empire.name} hexite treasury updated`)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(`\`\`\`
Net change         : ${sign(totalChange)}

Sum of deposits    : ${sign(totalDeposits)}
Sum of withdrawals : ${sign(totalWithdrawals)}
\`\`\`
`)
    );

  const results = await Promise.allSettled(
    serversToNotify.data.results.map((x) => client.channels.fetch(x.threadId))
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
    })
  );
}
