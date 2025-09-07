import RemoveRecipeCommand from "@src/application/commands/bitcraft/RemoveRecipeCommand";
import UpsertRecipeCommand from "@src/application/commands/bitcraft/UpsertRecipeCommand";
import { CommandBus } from "@src/framework";
import type { BitcraftRecipe, IEventContext } from "@src/vela";

export async function onRecipeInserted(
  _ctx: IEventContext,
  recipe: BitcraftRecipe,
) {
  await CommandBus.execute(new UpsertRecipeCommand(recipe));
}

export async function onRecipeUpdated(
  _ctx: IEventContext,
  _oldRecipe: BitcraftRecipe,
  newRecipe: BitcraftRecipe,
) {
  await CommandBus.execute(new UpsertRecipeCommand(newRecipe));
}

export async function onRecipeDeleted(
  _ctx: IEventContext,
  recipe: BitcraftRecipe,
) {
  await CommandBus.execute(new RemoveRecipeCommand(recipe));
}
