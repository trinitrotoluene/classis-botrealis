import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

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
    const claim = await CacheClient.getByIdGlobal(
      "BitcraftClaimState",
      this.args.claimId
    );
    if (claim) {
      return {
        name: claim.Name,
        entityId: claim.Id.toString(),
      };
    }
  }
}
