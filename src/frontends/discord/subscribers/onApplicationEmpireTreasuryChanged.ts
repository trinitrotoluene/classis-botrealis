import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import {
  QueryBus,
  type IApplicationEmpireTreasuryUpdated,
} from "@src/framework";
import { ContainerBuilder, MessageFlags, type Client } from "discord.js";

export async function onApplicationEmpireTreasuryChanged(
  client: Client,
  event: IApplicationEmpireTreasuryUpdated
) {
  const serversToNotify = await QueryBus.execute(
    new GetAllEmpireObservationThreadsQuery({
      empireId: event.empire.id,
    })
  );

  if (!serversToNotify.ok) {
    return;
  }

  const change = event.newAmount - event.oldAmount;
  const sign = change >= 0 ? "+" : "-";

  const builder = new ContainerBuilder()
    .setAccentColor(0xd9427e)
    .addTextDisplayComponents((c) =>
      c.setContent(`## ${event.empire.name} hexite treasury updated`)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(`\`\`\`
Old balance : ${event.oldAmount}
New amount  : ${event.newAmount}

Change      : ${sign}${change}
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
