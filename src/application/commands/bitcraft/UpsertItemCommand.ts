import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { CommandBase } from "@src/framework";
import type { BitcraftItem } from "@src/vela";

export default class UpsertItemCommand extends CommandBase<
  BitcraftItem,
  undefined
> {
  public async execute() {
    await db
      .insertInto("items")
      .values({
        id: this.args.Id.toString() as ItemsId,
        name: this.args.Name,
        description: this.args.Description,
        volume: this.args.Volume,
        tier: this.args.Tier,
        rarity: this.args.Rarity,
        item_list_id: this.args.ItemListId,
        has_compendium_entry: this.args.HasCompendiumEntry,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet((eb) => ({
          name: eb.ref("excluded.name"),
          description: eb.ref("excluded.description"),
          volume: eb.ref("excluded.volume"),
          tier: eb.ref("excluded.tier"),
          rarity: eb.ref("excluded.rarity"),
          item_list_id: eb.ref("excluded.item_list_id"),
          has_compendium_entry: eb.ref("excluded.has_compendium_entry"),
        })),
      )
      .executeTakeFirst();

    return undefined;
  }
}
