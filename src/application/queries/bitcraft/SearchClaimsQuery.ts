import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

interface Args {
  claimName: string;
}

interface Response {
  results: Array<{ name: string; entityId: string }>;
}

export default class SearchClaimsQuery extends CommandBase<Args, Response> {
  async execute() {
    const claims = await CacheClient.getAllGlobal("BitcraftClaimState");

    return {
      results: claims
        .values()
        .map((x) => ({
          name: x.Name,
          entityId: x.Id,
        }))
        .toArray(),
    };
  }
}
