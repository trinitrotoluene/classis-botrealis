import { BitcraftService } from "@src/bitcraft";
import { CommandBase } from "@src/framework";

interface Args {
  claimId: string;
}

interface Response {
  name: string;
  entityId: string;
}

export default class GetClaimQuery extends CommandBase<
  Args,
  Response | undefined
> {
  async execute() {
    const claim = BitcraftService.instance.getClaim(this.args.claimId);
    if (claim) {
      return {
        name: claim.name,
        entityId: claim.entityId.toString(),
      };
    }
  }
}
