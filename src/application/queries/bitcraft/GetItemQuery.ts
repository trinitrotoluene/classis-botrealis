import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";

interface Args {
  id: string;
}

interface Response {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
  volume: number;
}

export default class GetItemQuery extends CommandBase<
  Args,
  Response | undefined
> {
  async execute() {
    const result = await db
      .selectFrom("items")
      .selectAll()
      .where("id", "=", this.args.id as ItemsId)
      .executeTakeFirst();

    if (result) {
      return {
        id: result.id,
        name: result.name,
        description: result.description ?? "",
        tier: result.tier as Response["tier"],
        rarity: result.rarity as Response["rarity"],
        volume: result.volume,
        itemListId: result.item_list_id,
      };
    }
  }
}
