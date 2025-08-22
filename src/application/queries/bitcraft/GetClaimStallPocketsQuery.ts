import { BitcraftService } from "@src/bitcraft";
import { CommandBase } from "@src/framework";
interface Args {
  claimId: string;
}

type Response = Map<number, number>;

export default class GetClaimStallPocketsQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    return BitcraftService.instance.getBarterStallItems(this.args.claimId);
  }
}
