import type { EmpireState } from "@src/bindings";
import type { IBitcraftEmpire } from "@src/framework";

export function mapEmpireState(empire: EmpireState): IBitcraftEmpire {
  return {
    id: empire.entityId.toString(),
    name: empire.name,
    shardTreasury: empire.shardTreasury,
  };
}
