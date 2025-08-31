import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { CommandBase } from "@src/framework";
import type { BitcraftRecipe } from "@src/vela";

export default class RemoveRecipeCommand extends CommandBase<
  BitcraftRecipe,
  undefined
> {
  public async execute() {
    await db
      .deleteFrom("recipes")
      .where("id", "=", this.args.Id as RecipesId)
      .executeTakeFirst();

    return undefined;
  }
}
