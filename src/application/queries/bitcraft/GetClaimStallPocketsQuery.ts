import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";
interface Args {
  claimId: string;
}

type Response = Map<string, number>;

export default class GetClaimStallPocketsQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const claim = await CacheClient.getByIdGlobal(
      "BitcraftClaimState",
      this.args.claimId,
    );

    const buildingState = await CacheClient.getAll(
      "BitcraftBuildingState",
      claim?.Module,
    );

    const inventoryStates = await Promise.all(
      buildingState
        .values()
        .filter((x) => x.ClaimEntityId === this.args.claimId)
        .map((x) =>
          CacheClient.getById(
            "BitcraftInventoryState",
            claim?.Module,
            x.ClaimEntityId,
          ),
        ),
    );

    return inventoryStates.reduce((acc, current) => {
      if (!current) return acc;

      for (const pocket of current.Pockets) {
        const currentVal = acc.get(pocket.ItemId ?? "") ?? 0;
        acc.set(pocket.ItemId ?? "", currentVal + (pocket.Quantity ?? 0));
      }

      return acc;
    }, new Map<string, number>());
  }
}
