import { BitcraftService } from "@src/bitcraft";
import { CommandBase } from "@src/framework";

interface Args {
  claimName: string;
}

interface Response {
  results: Array<{ name: string; entityId: string }>;
}

export default class SearchClaimsQuery extends CommandBase<Args, Response> {
  async execute() {
    const claims = BitcraftService.instance.searchClaims(this.args.claimName);
    return {
      results: claims.map((x) => ({
        name: x.name,
        entityId: x.entityId.toString(),
      })),
    };
  }
}
