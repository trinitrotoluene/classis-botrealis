import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { type IBitcraftRecipeUpdated } from "@src/framework";

export async function onRecipeUpdated(event: IBitcraftRecipeUpdated) {
  const { newRecipe: recipe } = event;
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
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        name: eb.ref("excluded.name"),
        required_bench_type: eb.ref("excluded.required_bench_type"),
        required_bench_tier: eb.ref("excluded.required_bench_tier"),
        level_requirements: eb.ref("excluded.level_requirements"),
        tool_requirements: eb.ref("excluded.tool_requirements"),
        consumed_item_stacks: eb.ref("excluded.consumed_item_stacks"),
        produced_item_stacks: eb.ref("excluded.produced_item_stacks"),
        is_passive: eb.ref("excluded.is_passive"),
      }))
    )
    .executeTakeFirst();
}
