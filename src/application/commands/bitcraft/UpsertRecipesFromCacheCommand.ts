import { db } from "@src/database";
import type {
  NewRecipes,
  RecipesId,
} from "@src/database/__generated__/public/Recipes";
import { CommandBase } from "@src/framework";
import { chunkIterator } from "@src/framework/chunkIterator";
import { logger } from "@src/logger";
import { CacheClient } from "@src/vela";

export default class UpsertRecipesFromCacheCommand extends CommandBase<
  object,
  undefined
> {
  public async execute() {
    const recipeData = await CacheClient.getAllGlobal("BitcraftRecipe");
    const recipes = recipeData.values().toArray();

    logger.info(`Initialising recipe data with ${recipes.length} recipes`);

    // Go 750 recipes at a time
    for (const chunk of chunkIterator(recipes, 750)) {
      // For each recipe, map it to the structure expected by the DB
      const values: NewRecipes[] = [];
      for (const recipe of chunk) {
        values.push({
          id: recipe.Id.toString() as RecipesId,
          name: recipe.NameFormatString,
          required_bench_type: recipe.BuildingRequirement?.BuildingType,
          required_bench_tier: recipe.BuildingRequirement?.Tier,
          level_requirements: JSON.stringify(recipe.LevelRequirements),
          tool_requirements: JSON.stringify(recipe.ToolRequirements),
          consumed_item_stacks: JSON.stringify(recipe.ConsumedItemStacks),
          produced_item_stacks: JSON.stringify(recipe.ProducedItemStacks),
          is_passive: recipe.IsPassive,
          actions_required: recipe.ActionsRequired,
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
            actions_required: eb.ref("excluded.actions_required"),
          }))
        )
        .execute();
    }
    return undefined;
  }
}
