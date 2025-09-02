import GetEmpireSiegeContextQuery from "@src/application/queries/bitcraft/GetEmpireSiegeContextQuery";
import GetAllEmpireObservationThreadsQuery from "@src/application/queries/config/GetAllEmpireObservationThreadsQuery";
import { QueryBus } from "@src/framework";
import { logger } from "@src/logger";
import type { BitcraftEmpireNodeSiegeState } from "@src/vela";
import { ContainerBuilder, MessageFlags } from "discord.js";
import { DiscordBot } from "../bot";
import { sign } from "@src/utils/sign";
import { generateMapUrl } from "@src/utils/generateMapUrl";

const DEFAULT_NAME = "Unknown Empire";

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
    new GetEmpireSiegeContextQuery(state),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;
  if (attackingEmpire?.Id === defendingEmpire?.Id) {
    logger.info(
      "Skipping siege state insert as the update is for the defending party",
    );
    return;
  }

  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `## ${attackingEmpire?.Name ?? DEFAULT_NAME} started a siege on ${defendingEmpire?.Name ?? DEFAULT_NAME}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `⚔️ ${attackingEmpire?.Name ?? DEFAULT_NAME} has ${attackingEmpire?.ShardTreasury ?? "n/a"} shards
🛡️ ${defendingEmpire?.Name ?? DEFAULT_NAME} has ${defendingEmpire?.ShardTreasury ?? "n/a"} shards

🏰 The defending tower has ${tower?.Energy ?? "n/a"} energy

-# ${tower ? `[bitcraftmap.com](${generateMapUrl(tower?.LocationX, tower?.LocationZ, "Tower under siege")})` : "sorry dunno where the tower is"}`,
      ),
    );

  await publish(
    subscribingThreads.map((x) => x.threadId),
    builder,
  );
}

export async function onEmpireNodeSiegeStateUpdated(
  oldState: BitcraftEmpireNodeSiegeState,
  newState: BitcraftEmpireNodeSiegeState,
) {
  const getContextRequest = await QueryBus.execute(
    new GetEmpireSiegeContextQuery(newState),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;

  if (tower?.EmpireId === newState.EmpireId) {
    logger.info(
      "Skipping siege state update as the update is for the defending party",
    );
  }

  const subscribingThreads = await getEmpireThreadIds(newState.EmpireId);
  if (subscribingThreads.length < 1) {
    logger.info("Nobody cares about this empire, ignoring event");
    return;
  }

  const finalAmount = newState.Energy;
  const delta = newState.Energy - oldState.Energy;

  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `### Siege update: ${attackingEmpire?.Name ?? DEFAULT_NAME} vs ${defendingEmpire?.Name ?? DEFAULT_NAME}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `⚔️ ${attackingEmpire?.Name ?? DEFAULT_NAME}'s siege has ${finalAmount} energy (${sign(delta)})
🏰 ${defendingEmpire?.Name ?? DEFAULT_NAME}'s tower has ${tower?.Energy ?? "n/a"} energy remaining

-# ${tower ? generateMapUrl(tower?.LocationX, tower?.LocationZ, "Tower under siege") : "sorry dunno where the tower is"}`,
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
    new GetEmpireSiegeContextQuery(state),
  );

  if (!getContextRequest.ok) {
    logger.warn("Error retrieving siege context");
    return;
  }

  const { attackingEmpire, defendingEmpire, tower } = getContextRequest.data;
  if (attackingEmpire?.Id === defendingEmpire?.Id) {
    logger.info(
      "Skipping siege state update as the update is for the defending party",
    );
    return;
  }

  let outcomeMessage = "unknown";
  if (tower && (attackingEmpire || defendingEmpire)) {
    if (
      tower.EmpireId === attackingEmpire?.Id ||
      tower.EmpireId !== (defendingEmpire?.Id ?? -1)
    ) {
      outcomeMessage = "✅ Siege successful, tower taken by attacker!";
    } else {
      outcomeMessage = "❌ The attack was successfully defended!";
    }
  }

  const builder = new ContainerBuilder()
    .setAccentColor(0xf05a4f)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `## Siege by ${attackingEmpire?.Name ?? DEFAULT_NAME} on ${defendingEmpire?.Name ?? DEFAULT_NAME} has ended`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((c) =>
      c.setContent(
        `⚔️ ${attackingEmpire?.Name ?? DEFAULT_NAME} has ${attackingEmpire?.ShardTreasury ?? "n/a"} shards
🛡️ ${defendingEmpire?.Name ?? DEFAULT_NAME} has ${defendingEmpire?.ShardTreasury ?? "n/a"} shards

${outcomeMessage}`,
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
