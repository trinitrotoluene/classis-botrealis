import { db } from "@src/database";
import type { CargoItemsId } from "@src/database/__generated__/public/CargoItems";
import { CommandBase } from "@src/framework";
import type { BitcraftCargoItem } from "@src/vela";

export default class UpsertCargoItemCommand extends CommandBase<
  BitcraftCargoItem,
  undefined
> {
  public async execute() {
    await db
      .insertInto("cargo_items")
      .values({
        id: this.args.Id as CargoItemsId,
        name: this.args.Name,
        description: this.args.Description ?? null,
        volume: this.args.Volume,
        tier: this.args.Tier === -1 ? 0 : this.args.Tier,
        rarity: this.args.Rarity,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet((eb) => ({
          name: eb.ref("excluded.name"),
          description: eb.ref("excluded.description"),
          volume: eb.ref("excluded.volume"),
          tier: eb.ref("excluded.tier"),
          rarity: eb.ref("excluded.rarity"),
        })),
      )
      .executeTakeFirst();

    return undefined;
  }
}
