import { db } from "@src/database";
import type { TrackedInventoryContributionSessionsId } from "@src/database/__generated__/public/TrackedInventoryContributionSessions";
import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

interface Args {
  contributionSessionId: string;
}
type ItemId = string;
type PlayerId = string;
type ContributionMetadata = {
  playerId: string;
  playerName?: string;
  netContribution: number;
};

type Result = {
  contributionsByItem: Map<ItemId, Map<PlayerId, ContributionMetadata>>;
  contributionsByPlayer: Map<PlayerId, Map<ItemId, ContributionMetadata>>;
};

export default class GetContributionsToInventoryQuery extends CommandBase<
  Args,
  Result
> {
  async execute() {
    const contributions = await db
      .selectFrom("tracked_inventory_contributions")
      .selectAll()
      .where(
        "session_id",
        "=",
        this.args
          .contributionSessionId as TrackedInventoryContributionSessionsId,
      )
      .execute();

    const contributionsByItem: Map<
      ItemId,
      Map<PlayerId, ContributionMetadata>
    > = new Map();
    const contributionsByPlayer: Map<
      PlayerId,
      Map<ItemId, ContributionMetadata>
    > = new Map();

    for (const contribution of contributions) {
      const playerId = contribution.bitcraft_user_id ?? "unknown";
      const itemId = contribution.item_id;

      let itemMap = contributionsByItem.get(itemId);
      if (!itemMap) {
        itemMap = new Map();
        contributionsByItem.set(itemId, itemMap);
      }

      let playerMap = contributionsByPlayer.get(playerId);
      if (!playerMap) {
        playerMap = new Map();
        contributionsByPlayer.set(playerId, playerMap);
      }

      let itemEntry = itemMap.get(playerId);
      if (!itemEntry) {
        itemEntry = {
          playerId,
          playerName: (
            await CacheClient.getByIdGlobal("BitcraftUsernameState", playerId)
          )?.Username,
          netContribution: 0,
        };
        itemMap.set(playerId, itemEntry);
      }

      let playerEntry = playerMap.get(itemId);
      if (!playerEntry) {
        playerEntry = {
          playerId,
          playerName: (
            await CacheClient.getByIdGlobal("BitcraftUsernameState", playerId)
          )?.Username,
          netContribution: 0,
        };
        playerMap.set(itemId, playerEntry);
      }

      itemEntry.netContribution += contribution.change;
      playerEntry.netContribution += contribution.change;
    }

    return {
      contributionsByItem,
      contributionsByPlayer,
    };
  }
}
