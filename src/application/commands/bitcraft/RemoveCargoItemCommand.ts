import { db } from "@src/database";
import type { CargoItemsId } from "@src/database/__generated__/public/CargoItems";
import { CommandBase } from "@src/framework";
import type { BitcraftCargoItem } from "@src/vela";

export default class RemoveCargoItemCommand extends CommandBase<
  BitcraftCargoItem,
  undefined
> {
  public async execute() {
    await db
      .deleteFrom("cargo_items")
      .where("id", "=", this.args.Id as CargoItemsId)
      .executeTakeFirst();

    return undefined;
  }
}
