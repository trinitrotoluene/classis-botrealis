import { BitcraftService } from "@src/bitcraft";
import { ProgressiveActionStateCache } from "../services";
import {
  PubSub,
  type IBitcraftProgressiveActionAdded,
  type IBitcraftProgressiveActionDeleted,
  type IBitcraftProgressiveActionUpdated,
  type IBitcraftRecipe,
} from "@src/framework";
import { db } from "@src/database";
import type { RecipesId } from "@src/database/__generated__/public/Recipes";
import { logger } from "@src/logger";
import type { ItemsId } from "@src/database/__generated__/public/Items";

const AlreadySeenEventsId = new Set<string>();

export async function onProgressiveActionStateAdded(
  event: IBitcraftProgressiveActionAdded
) {
  if (AlreadySeenEventsId.has(event.entity.id)) {
    logger.debug("Already seen this entity, skipping");
    return;
  }

  AlreadySeenEventsId.add(event.entity.id);

  ProgressiveActionStateCache.set(event.entity.id, event.entity);

  const linkedBuilding = BitcraftService.instance.getBuildingState(
    event.entity.buildingEntityId
  );

  const claim = linkedBuilding
    ? BitcraftService.instance.getClaim(linkedBuilding.claimEntityId.toString())
    : undefined;

  const recipe = await db
    .selectFrom("recipes")
    .selectAll()
    .where("id", "=", event.entity.recipeId.toString() as RecipesId)
    .executeTakeFirst();

  if (!recipe) {
    logger.warn(
      event,
      "Progressive action state event contained an unknown recipe ID"
    );
    return;
  }

  const effort = (recipe.actions_required ?? 0) * event.entity.craftCount;

  if (effort < 25_000) {
    logger.debug(
      `Craft does not meet notification threshold (${effort} effort)`
    );
    return;
  }

  const producedItems =
    recipe.produced_item_stacks as IBitcraftRecipe["producedItemStacks"];

  const items = await db
    .selectFrom("items")
    .selectAll()
    .where(
      "id",
      "in",
      producedItems.map((x) => x.itemId.toString() as ItemsId)
    )
    .execute();

  const location = await BitcraftService.instance.oneOffLocationSubscription(
    event.entity.buildingEntityId
  );

  PubSub.publish("application_shared_craft_started", {
    type: "application_shared_craft_started",
    id: event.entity.id,
    claimName: claim?.name ?? "n/a",
    effort: effort,
    progress: event.entity.progress,
    location: location
      ? {
          x: location.x,
          y: location.z,
          chunkIndex: location.chunkIndex.toString(),
        }
      : undefined,
    producedItems: items.map((x) => ({
      id: x.id,
      name: x.name,
      description: x.description ?? "n/a",
      tier: x.tier,
      rarity: x.rarity,
    })),
  });
}

export function onProgressiveActionStateUpdated(
  event: IBitcraftProgressiveActionUpdated
) {
  ProgressiveActionStateCache.set(event.newEntity.id, event.newEntity);
}

export function onProgressiveActionStateDeleted(
  event: IBitcraftProgressiveActionDeleted
) {
  ProgressiveActionStateCache.delete(event.entity.id);
  PubSub.publish("application_shared_craft_removed", {
    type: "application_shared_craft_removed",
    id: event.entity.id,
  });
}
