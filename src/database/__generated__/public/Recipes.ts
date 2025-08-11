import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.recipes */
export type RecipesId = string & { __brand: 'public.recipes' };

/** Represents the table public.recipes */
export default interface RecipesTable {
  id: ColumnType<RecipesId, RecipesId, RecipesId>;

  name: ColumnType<string, string, string>;

  required_bench_type: ColumnType<number | null, number | null, number | null>;

  required_bench_tier: ColumnType<number | null, number | null, number | null>;

  level_requirements: ColumnType<unknown, unknown, unknown>;

  tool_requirements: ColumnType<unknown, unknown, unknown>;

  consumed_item_stacks: ColumnType<unknown, unknown, unknown>;

  produced_item_stacks: ColumnType<unknown, unknown, unknown>;

  is_passive: ColumnType<boolean, boolean | undefined, boolean>;

  actions_required: ColumnType<number | null, number | null, number | null>;
}

export type Recipes = Selectable<RecipesTable>;

export type NewRecipes = Insertable<RecipesTable>;

export type RecipesUpdate = Updateable<RecipesTable>;