import { BitcraftService } from "@src/bitcraft";
import { CommandBase } from "@src/framework";

interface Args {
  searchText: string;
}

interface Response {
  results: Array<{
    id: string;
    name: string;
  }>;
}

export default class GetEmpiresQuery extends CommandBase<Args, Response> {
  execute() {
    return {
      results: BitcraftService.instance
        .getEmpires(this.args.searchText)
        .map((x) => ({
          id: x.entityId.toString(),
          name: x.name,
        })),
    };
  }
}
