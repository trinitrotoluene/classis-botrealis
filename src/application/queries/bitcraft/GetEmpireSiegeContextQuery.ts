import { CommandBase } from "@src/framework";
import {
  CacheClient,
  type BitcraftEmpireNodeSiegeState,
  type BitcraftEmpireNodeState,
  type BitcraftEmpireState,
} from "@src/vela";

type Args = BitcraftEmpireNodeSiegeState;

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
      this.args.EmpireId,
    );

    const tower = await CacheClient.getById(
      "BitcraftEmpireNodeState",
      this.args.Module,
      this.args.BuildingEntityId,
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
