import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { type IBitcraftRecipeAdded } from "@src/framework";

export async function onRecipeAdded(event: IBitcraftRecipeAdded) {
  const { entity: recipe } = event;
  await db
    .insertInto("recipes")
    .values({
      id: recipe.id.toString() as RecipesId,
      name: recipe.nameFormatString,
      required_bench_type: recipe.buildingRequirement?.buildingType,
      required_bench_tier: recipe.buildingRequirement?.tier,
      level_requirements: JSON.stringify(recipe.levelRequirements),
      tool_requirements: JSON.stringify(recipe.toolRequirements),
      consumed_item_stacks: JSON.stringify(recipe.consumedItemStacks),
      produced_item_stacks: JSON.stringify(recipe.producedItemStacks),
      is_passive: recipe.isPassive,
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .executeTakeFirst();
}
