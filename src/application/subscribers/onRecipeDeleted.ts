import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { type IBitcraftRecipeDeleted } from "@src/framework";

export async function onRecipeDeleted(event: IBitcraftRecipeDeleted) {
  const { id } = event;
  await db
    .deleteFrom("recipes")
    .where("id", "=", id.toString() as RecipesId)
    .executeTakeFirst();
}
