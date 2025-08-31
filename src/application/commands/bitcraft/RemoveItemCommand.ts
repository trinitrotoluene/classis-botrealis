import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import type { BitcraftItem } from "@src/vela";

export default class RemoveItemCommand extends CommandBase<
  BitcraftItem,
  undefined
> {
  public async execute() {
    await db
      .deleteFrom("items")
      .where("id", "=", this.args.Id as ItemsId)
      .executeTakeFirst();

    return undefined;
  }
}
