import { db } from "@src/database";
import ServerFeature from "@src/database/__generated__/public/ServerFeature";
import { CommandBase } from "@src/framework";
import { sql } from "kysely";

type Args = {
  claimId: string;
  currentSupply: number;
};

type Response = {
  channelId: string;
}[];

export default class GetSupplyAlertChannelsQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const results = await db
      .selectFrom("claim_supply_alerts")
      .where("claim_supply_alerts.claim_id", "=", this.args.claimId)
      .where(
        "claim_supply_alerts.supply_threshold",
        ">=",
        this.args.currentSupply,
      )
      .innerJoin(
        "server_config",
        "claim_supply_alerts.discord_server_id",
        "server_config.id",
      )
      .where("server_config.supply_alert_channel_id", "is not", null)
      .where(
        sql<boolean>`${ServerFeature.supply_alerts} = ANY(server_config.features_enabled)`,
      )
      .select(["server_config.supply_alert_channel_id as channelId"])
      .execute();

    return (
      results
        .filter((x) => x.channelId)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map((row) => ({ channelId: row.channelId! }))
    );
  }
}
