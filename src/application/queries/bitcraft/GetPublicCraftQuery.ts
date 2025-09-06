import { db } from "@src/database";
import type { Items, ItemsId } from "@src/database/__generated__/public/Items";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";
import {
  CacheClient,
  type BitcraftLocationState,
  type BitcraftProgressiveAction,
  type BitcraftPublicProgressiveAction,
  type BitcraftRecipe,
  type BitcraftUsernameState,
} from "@src/vela";

type Args = BitcraftPublicProgressiveAction;

type Response = {
  user?: BitcraftUsernameState;
  location?: BitcraftLocationState;
  producedItems: Items[];
  progress: number;
  effort: number;
};

const AlreadySeenEventsId = new Set<string>();

export default class GetPublicCraftQuery extends CommandBase<
  Args,
  Response | undefined
> {
  async execute() {
    if (AlreadySeenEventsId.has(this.args.Id)) {
      logger.debug("Already seen this entity, skipping");
      return;
    }

    let linkedState: BitcraftProgressiveAction | undefined = undefined;

    const maxAttempts = 3;
    let attempts = 0;

    while (!linkedState && attempts++ < maxAttempts) {
      linkedState = await CacheClient.getById(
        "BitcraftProgressiveAction",
        this.args.Module,
        this.args.Id,
      );

      if (!linkedState && attempts < maxAttempts) {
        logger.warn(
          "Notified of a public craft but it is not present in cache - waiting 2 seconds before checking again",
        );
        await new Promise((resolve) => setTimeout(() => resolve(null), 2000));
      }
    }

    if (!linkedState) {
      logger.warn("Notified of a public craft but it is not present in cache");
      return;
    }

    AlreadySeenEventsId.add(this.args.Id);

    const linkedBuilding = await CacheClient.getById(
      "BitcraftBuildingState",
      this.args.Module,
      this.args.BuildingEntityId,
    );

    if (!linkedBuilding) {
      logger.warn("received shared craft state for unknown building");
      return;
    }

    const claim = await CacheClient.getByIdGlobal(
      "BitcraftClaimState",
      linkedBuilding.ClaimEntityId,
    );

    const recipe = await db
      .selectFrom("recipes")
      .selectAll()
      .where("id", "=", linkedState.RecipeId as RecipesId)
      .executeTakeFirst();

    const location = await CacheClient.getById(
      "BitcraftLocationState",
      this.args.Module,
      this.args.BuildingEntityId,
    );

    const user = await CacheClient.getByIdGlobal(
      "BitcraftUsernameState",
      this.args.OwnerEntityId,
    );

    if (!recipe) {
      logger.warn(
        this.args,
        "Progressive action state event contained an unknown recipe ID",
      );
      return;
    }

    const effort = (recipe.actions_required ?? 0) * linkedState.CraftCount;

    if (effort < 50_000) {
      logger.debug(
        `Craft does not meet notification threshold (${effort} effort)`,
      );
      return;
    }

    const producedItems =
      recipe.produced_item_stacks as BitcraftRecipe["ProducedItemStacks"];

    const items = await db
      .selectFrom("items")
      .selectAll()
      .where("id", "in", producedItems.map((x) => x.ItemId) as ItemsId[])
      .execute();

    return {
      location,
      claim,
      producedItems: items,
      user,
      progress: linkedState.Progress,
      effort,
    };
  }
}
