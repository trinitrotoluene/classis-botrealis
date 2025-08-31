import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { CommandBase } from "@src/framework";
import type { BitcraftRecipe } from "@src/vela";

export default class UpsertRecipeCommand extends CommandBase<
  BitcraftRecipe,
  undefined
> {
  public async execute() {
    await db
      .insertInto("recipes")
      .values({
        id: this.args.Id.toString() as RecipesId,
        name: this.args.NameFormatString,
        required_bench_type: this.args.BuildingRequirement?.BuildingType,
        required_bench_tier: this.args.BuildingRequirement?.Tier,
        level_requirements: JSON.stringify(this.args.LevelRequirements),
        tool_requirements: JSON.stringify(this.args.ToolRequirements),
        consumed_item_stacks: JSON.stringify(this.args.ConsumedItemStacks),
        produced_item_stacks: JSON.stringify(this.args.ProducedItemStacks),
        is_passive: this.args.IsPassive,
        actions_required: this.args.ActionsRequired,
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
          actions_required: eb.ref("excluded.actions_required"),
        }))
      )
      .executeTakeFirst();

    return undefined;
  }
}
