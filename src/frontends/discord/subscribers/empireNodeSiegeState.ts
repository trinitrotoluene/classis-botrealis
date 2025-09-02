import GetEmpireSiegeContextQuery from "@src/application/queries/bitcraft/GetEmpireSiegeContextQuery";
import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import { EventAggregator, QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import type { BitcraftEmpireNodeSiegeState } from "@src/vela";
import { ContainerBuilder, MessageFlags } from "discord.js";
import { DiscordBot } from "../bot";

async function getEmpireThreadIds(empireId: string) {
  const serversToNotify = await QueryBus.execute(
    new GetAllEmpireObservationThreadsQuery({
      empireId,
    }),
  );

  if (!serversToNotify.ok) {
    return [];
  }

  return serversToNotify.data.results;
}

export async function onEmpireNodeSiegeStateAdded(
  state: BitcraftEmpireNodeSiegeState,
) {
  const subscribingThreads = await getEmpireThreadIds(state.EmpireId);
  if (subscribingThreads.length < 1) {
    logger.info("Nobody cares about this empire, ignoring event");
    return;
  }

  const getContextRequest = await QueryBus.execute(
    new GetEmpireSiegeContextQuery({
      siegeEmpireId: state.EmpireId,
      siegeBuildingEntityId: state.BuildingEntityId,
    }),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;
  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `## ${attackingEmpire?.Name ?? "Unknown empire"} started a siege on ${defendingEmpire?.Name ?? "Unknown empire"}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        attackingEmpire && defendingEmpire
          ? `⚔️ ${attackingEmpire.Name} has ${attackingEmpire.ShardTreasury} shards
🛡️ ${defendingEmpire.Name} has ${defendingEmpire.ShardTreasury} shards

🏰 The defending tower has ${tower?.Energy ?? "n/a"} energy`
          : "Data missing",
      ),
    );

  await publish(
    subscribingThreads.map((x) => x.threadId),
    builder,
  );
}

const Aggregator = new EventAggregator<{
  oldState: BitcraftEmpireNodeSiegeState;
  newState: BitcraftEmpireNodeSiegeState;
}>();

export function onEmpireNodeSiegeStateUpdated(
  oldState: BitcraftEmpireNodeSiegeState,
  newState: BitcraftEmpireNodeSiegeState,
) {
  Aggregator.push(
    newState.Id,
    { oldState, newState },
    onSiegeUpdatesCallback,
    10,
  );
}

async function onSiegeUpdatesCallback(
  events: Array<{
    oldState: BitcraftEmpireNodeSiegeState;
    newState: BitcraftEmpireNodeSiegeState;
  }>,
) {
  const subscribingThreads = await getEmpireThreadIds(
    events[0].newState.EmpireId,
  );

  if (subscribingThreads.length < 1) {
    logger.info("Nobody cares about this empire, ignoring event");
    return;
  }

  const { delta, finalAmount } = events.reduce(
    (acc, { oldState, newState }) => {
      const change = newState.Energy - oldState.Energy;
      acc.delta += change;
      acc.finalAmount = newState.Energy;
      return acc;
    },
    {
      delta: 0,
      finalAmount: 0,
    },
  );

  const getContextRequest = await QueryBus.execute(
    new GetEmpireSiegeContextQuery({
      siegeEmpireId: events[0].newState.EmpireId,
      siegeBuildingEntityId: events[0].oldState.BuildingEntityId,
    }),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;

  const sign = (n: number) => (n > 0 ? `+${n}` : n.toString());
  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `### Siege update: ${attackingEmpire?.Name ?? "Unknown empire"} vs ${defendingEmpire?.Name ?? "Unknown empire"}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        attackingEmpire && defendingEmpire
          ? `⚔️ ${attackingEmpire.Name}'s siege has ${finalAmount} energy (${sign(delta)})
🏰 ${defendingEmpire.Name}'s tower has ${tower?.Energy ?? "n/a"} energy remaining`
          : "Data missing",
      ),
    );

  await publish(
    subscribingThreads.map((x) => x.threadId),
    builder,
  );
}

export async function onEmpireNodeSiegeStateDeleted(
  state: BitcraftEmpireNodeSiegeState,
) {
  const subscribingThreads = await getEmpireThreadIds(state.EmpireId);
  if (subscribingThreads.length < 1) {
    logger.info("Nobody cares about this empire, ignoring event");
    return;
  }

  const getContextRequest = await QueryBus.execute(
    new GetEmpireSiegeContextQuery({
      siegeEmpireId: state.EmpireId,
      siegeBuildingEntityId: state.BuildingEntityId,
    }),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;
  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `## Siege by ${attackingEmpire?.Name ?? "Unknown empire"} on ${defendingEmpire?.Name ?? "Unknown empire"} has ended`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        attackingEmpire && defendingEmpire
          ? `⚔️ ${attackingEmpire.Name} has ${attackingEmpire.ShardTreasury} shards
🛡️ ${defendingEmpire.Name} has ${defendingEmpire.ShardTreasury} shards

🏰 The defending tower has ${tower?.Energy ?? "n/a"} energy`
          : "Data missing",
      ),
    );

  await publish(
    subscribingThreads.map((x) => x.threadId),
    builder,
  );
}

async function publish(threads: string[], builder: ContainerBuilder) {
  const results = await Promise.allSettled(
    threads.map((x) => DiscordBot.channels.fetch(x)),
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
