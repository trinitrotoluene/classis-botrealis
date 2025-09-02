import { CommandBase } from "@src/framework";
import {
  CacheClient,
  type BitcraftEmpireNodeState,
  type BitcraftEmpireState,
} from "@src/vela";

interface Args {
  siegeEmpireId: string;
  siegeBuildingEntityId: string;
  module?: string;
}

type Response = {
  defendingEmpire?: BitcraftEmpireState;
  attackingEmpire?: BitcraftEmpireState;
  tower?: BitcraftEmpireNodeState;
};

export default class GetEmpireSiegeContextQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const attackingEmpire = await CacheClient.getByIdGlobal(
      "BitcraftEmpireState",
      this.args.siegeEmpireId,
    );

    const tower = await CacheClient.getById(
      "BitcraftEmpireNodeState",
      this.args.module,
      this.args.siegeBuildingEntityId,
    );

    const defendingEmpire = tower
      ? await CacheClient.getByIdGlobal("BitcraftEmpireState", tower?.EmpireId)
      : undefined;

    return {
      attackingEmpire,
      defendingEmpire,
      tower: tower,
    };
  }
}
