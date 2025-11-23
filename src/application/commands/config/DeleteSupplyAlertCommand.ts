import { db } from "@src/database";
import { CommandBase } from "@src/framework";

type Args = {
  discordServerId: string;
  claimId: string;
};

type Response = object;

export default class DeleteSupplyAlertCommand extends CommandBase<
  Args,
  Response
> {
  async execute() {
    await db
      .deleteFrom("claim_supply_alerts")
      .where("discord_server_id", "=", this.args.discordServerId)
      .where("claim_id", "=", this.args.claimId)
      .executeTakeFirstOrThrow();
  }
}
