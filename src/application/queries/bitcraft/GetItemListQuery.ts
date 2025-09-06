import { db } from "@src/database";
import type { Items, ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";
interface Args {
  id: string;
}

type Response = {
  id: string;
  name: string;
  possibilities: Array<{
    probability: number;
    items: Array<{
      name: string;
      quantity: number;
      tier: Items["tier"];
      rarity: Items["rarity"];
    }>;
  }>;
};

export default class GetItemListQuery extends CommandBase<Args, Response> {
  async execute() {
    const itemLists = await CacheClient.getAllGlobal("BitcraftItemList");
    const itemList = itemLists.get(this.args.id);

    if (!itemList) {
      throw new Error(`No item list found with ID ${this.args.id}`);
    }

    const itemIds = new Set(
      itemList.Possibilities.flatMap((x) =>
        x.Items.map((x) => x.ItemId.toString() as ItemsId),
      ),
    )
      .values()
      .toArray();

    const items = await db
      .selectFrom("items")
      .select(["id", "name", "rarity", "tier"])
      .where("id", "in", itemIds)
      .execute();

    return {
      id: itemList.Id,
      name: itemList.Name,
      possibilities: itemList.Possibilities.map((x) => ({
        probability: x.Probability,
        items: x.Items.map((itemPossibility) => {
          const item = items.find(
            (x) => x.id === itemPossibility.ItemId.toString(),
          );
          return {
            name: item?.name ?? "n/a",
            quantity: itemPossibility.Quantity,
            rarity: item?.rarity ?? "Unknown",
            tier: item?.tier ?? 0,
          };
        }),
      })),
    };
  }
}
