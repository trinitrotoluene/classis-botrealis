import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  discordServerId: string;
  claimId: string;
  supplyThreshold: number;
};

type Response = object;

export default class AddSupplyAlertCommand extends CommandBase<Args, Response> {
  async execute() {
    await db
      .insertInto("claim_supply_alerts")
      .values({
        discord_server_id: this.args.discordServerId,
        claim_id: this.args.claimId,
        supply_threshold: this.args.supplyThreshold,
      })
      .onConflict((oc) =>
        oc.columns(["discord_server_id", "claim_id"]).doUpdateSet({
          supply_threshold: this.args.supplyThreshold,
        }),
      )
      .executeTakeFirstOrThrow();
  }
}
