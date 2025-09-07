import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import { type BitcraftInventoryState } from "@src/vela";

interface Args {
  oldState: BitcraftInventoryState;
  newState: BitcraftInventoryState;
}

export interface Response {
  newState: Map<string, PartialItemWithQuantity>;
  diff: Map<string, DiffWithItem>;
}

type PartialItemWithQuantity = PartialItem & { quantity: number };

type PartialItem = {
  id: string;
  name?: string;
  rarity?: string;
  tier?: number;
};

type DiffWithItem = Diff & {
  item?: Required<PartialItem>;
};

interface Diff {
  itemId: string;
  oldQuantity: number;
  newQuantity: number;
  diff: number;
}

export default class GetInventoryStateChangeInfoQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const oldQuantities = accumulateQuantities(this.args.oldState.Pockets);
    const newQuantities = accumulateQuantities(this.args.newState.Pockets);

    const diffMap = new Map<string, Diff>();

    const uniqueItemIds = new Set([
      ...newQuantities.keys(),
      ...oldQuantities.keys(),
    ]);

    const itemData = await db
      .selectFrom("items")
      .select(["id", "name", "tier", "rarity"])
      .where("id", "in", Array.from(uniqueItemIds) as ItemsId[])
      .execute();

    const itemDataMap = new Map<string, Required<PartialItem>>();
    for (const item of itemData) {
      itemDataMap.set(item.id, {
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        tier: item.tier,
      });
    }

    const itemWithQuantityMap = new Map<string, PartialItemWithQuantity>();
    for (const itemId of uniqueItemIds) {
      const newQuantity = newQuantities.get(itemId) ?? 0;
      const oldQuantity = oldQuantities.get(itemId) ?? 0;
      const change = newQuantity - oldQuantity;

      if (newQuantity > 0) {
        const itemInfo = itemDataMap.get(itemId);
        const partialItem: PartialItemWithQuantity = {
          ...itemInfo,
          id: itemId,
          quantity: newQuantity,
        };
        itemWithQuantityMap.set(itemId, partialItem);
      }

      if (change === 0) continue;
      diffMap.set(itemId, {
        itemId,
        diff: change,
        oldQuantity,
        newQuantity,
      });
    }

    if (diffMap.size < 1) {
      return {
        newState: itemWithQuantityMap,
        diff: new Map<string, DiffWithItem>(),
      };
    }

    return {
      newState: itemWithQuantityMap,
      diff: new Map<string, DiffWithItem>(
        diffMap.entries().map(([k, v]) => {
          const item = itemDataMap.get(v.itemId);
          const finalDiff: DiffWithItem = { ...v };

          if (item) {
            finalDiff.item = item;
          }

          return [k, finalDiff];
        }),
      ),
    };
  }
}

function accumulateQuantities(
  pockets: BitcraftInventoryState["Pockets"],
): Map<string, number> {
  const result = new Map<string, number>();
  for (const pocket of pockets) {
    if (!pocket.ItemId || pocket.Quantity == null) continue;
    result.set(
      pocket.ItemId,
      (result.get(pocket.ItemId) ?? 0) + pocket.Quantity,
    );
  }
  return result;
}
