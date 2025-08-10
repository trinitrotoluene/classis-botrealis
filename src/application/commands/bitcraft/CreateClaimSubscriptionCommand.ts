import { BitcraftService } from "@src/bitcraft";
import { CommandBase } from "@src/framework";

interface Args {
  claimId: string;
}

export default class CreateClaimSubscriptionCommand extends CommandBase<
  Args,
  void
> {
  async execute() {
    await BitcraftService.instance.createClaimSubscription(this.args.claimId);
  }
}
