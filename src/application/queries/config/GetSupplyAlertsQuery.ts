import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

type Args = {
  discordServerId: string;
};

type Response = {
  claimId: string;
  name?: string;
  supplyThreshold: number;
}[];

export default class GetSupplyAlertsQuery extends CommandBase<Args, Response> {
  async execute() {
    const results = await db
      .selectFrom("claim_supply_alerts")
      .select(["claim_id", "supply_threshold"])
      .where("discord_server_id", "=", this.args.discordServerId)
      .execute();

    const enhancedResults = await Promise.all(
      results.map(async (row) => {
        const claim = await CacheClient.getByIdGlobal(
          "BitcraftClaimState",
          row.claim_id,
        );
        return {
          claimId: row.claim_id,
          name: claim ? claim.Name : undefined,
          supplyThreshold: row.supply_threshold,
        };
      }),
    );

    return enhancedResults;
  }
}
