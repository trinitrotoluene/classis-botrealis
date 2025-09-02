import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

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
  async execute() {
    const empires = await CacheClient.getAllGlobal("BitcraftEmpireState");
    return {
      results: empires
        .values()
        .filter((x) =>
          x.Name.toLowerCase().includes(this.args.searchText.toLowerCase()),
        )
        .map((x) => ({
          id: x.Id,
          name: x.Name,
        }))
        .toArray()
        .slice(0, 25),
    };
  }
}
