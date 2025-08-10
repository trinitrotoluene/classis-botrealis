import { db } from "@src/database";
import type {
  NewRecipes,
  RecipesId,
} from "@src/database/__generated__/public/Recipes";
import { type IBitcraftRecipesInit } from "@src/framework";
import { chunkIterator } from "@src/framework/chunkIterator";
import { logger } from "@src/logger";

export async function onRecipesInit(event: IBitcraftRecipesInit) {
  const { recipes } = event;

  logger.info(`Initialising recipe data with ${recipes.length} recipes`);

  // Go 750 recipes at a time
  for (const chunk of chunkIterator(recipes, 750)) {
    // For each recipe, map it to the structure expected by the DB
    const values: NewRecipes[] = [];
    for (const recipe of chunk) {
      values.push({
        id: recipe.id.toString() as RecipesId,
        name: recipe.nameFormatString,
        required_bench_type: recipe.buildingRequirement?.buildingType,
        required_bench_tier: recipe.buildingRequirement?.tier,
        level_requirements: JSON.stringify(recipe.levelRequirements),
        tool_requirements: JSON.stringify(recipe.toolRequirements),
        consumed_item_stacks: JSON.stringify(recipe.consumedItemStacks),
        produced_item_stacks: JSON.stringify(recipe.producedItemStacks),
        is_passive: recipe.isPassive,
      });
    }

    // Bulk upsert
    await db
      .insertInto("recipes")
      .values(values)
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
      .execute();
  }
}
