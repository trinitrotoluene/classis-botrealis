import RemoveRecipeCommand from "@src/application/commands/bitcraft/RemoveRecipeCommand";
import UpsertRecipeCommand from "@src/application/commands/bitcraft/UpsertRecipeCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftRecipe } from "@src/vela";

export async function onRecipeInserted(recipe: BitcraftRecipe) {
  await CommandBus.execute(new UpsertRecipeCommand(recipe));
}

export async function onRecipeUpdated(
  _oldRecipe: BitcraftRecipe,
  newRecipe: BitcraftRecipe,
) {
  await CommandBus.execute(new UpsertRecipeCommand(newRecipe));
}

export async function onRecipeDeleted(recipe: BitcraftRecipe) {
  await CommandBus.execute(new RemoveRecipeCommand(recipe));
}
