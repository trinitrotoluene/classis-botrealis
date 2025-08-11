import { PubSub } from "@src/framework";
import { onRecipesInit } from "./onRecipesInit";
import { onRecipeAdded } from "./onRecipeAdded";
import { onRecipeUpdated } from "./onRecipeUpdated";
import { onRecipeDeleted } from "./onRecipeDeleted";
import { onItemsInit } from "./onItemsInit";
import { onItemAdded } from "./onItemAdded";
import { onItemUpdated } from "./onItemUpdated";
import { onItemDeleted } from "./onItemDeleted";
import { onBuyOrdersInit } from "./onBuyOrdersInit";
import { onBuyOrderUpdated } from "./onBuyOrderUpdated";
import { onBuyOrderDeleted } from "./onBuyOrderDeleted";
import { onBuyOrderAdded } from "./onBuyOrderAdded";
import { onSellOrdersInit } from "./onSellOrdersInit";
import { onSellOrderAdded } from "./onSellOrderAdded";
import { onSellOrderUpdated } from "./onSellOrderUpdated";
import { onSellOrderDeleted } from "./onSellOrderDeleted";
import {
  onProgressiveActionStateAdded,
  onPublicProgressiveActionStateDeleted,
} from "./onPublicProgressiveActionState";

export function registerApplicationSubscribers() {
  PubSub.subscribe("bitcraft_recipes_init", onRecipesInit);
  PubSub.subscribe("bitcraft_recipe_added", onRecipeAdded);
  PubSub.subscribe("bitcraft_recipe_updated", onRecipeUpdated);
  PubSub.subscribe("bitcraft_recipe_deleted", onRecipeDeleted);

  PubSub.subscribe("bitcraft_items_init", onItemsInit);
  PubSub.subscribe("bitcraft_item_added", onItemAdded);
  PubSub.subscribe("bitcraft_item_updated", onItemUpdated);
  PubSub.subscribe("bitcraft_item_deleted", onItemDeleted);

  PubSub.subscribe("bitcraft_buy_orders_init", onBuyOrdersInit);
  PubSub.subscribe("bitcraft_buy_order_added", onBuyOrderAdded);
  PubSub.subscribe("bitcraft_buy_order_updated", onBuyOrderUpdated);
  PubSub.subscribe("bitcraft_buy_order_deleted", onBuyOrderDeleted);

  PubSub.subscribe("bitcraft_sell_orders_init", onSellOrdersInit);
  PubSub.subscribe("bitcraft_sell_order_added", onSellOrderAdded);
  PubSub.subscribe("bitcraft_sell_order_updated", onSellOrderUpdated);
  PubSub.subscribe("bitcraft_sell_order_deleted", onSellOrderDeleted);

  PubSub.subscribe(
    "bitcraft_progressive_action_added",
    onProgressiveActionStateAdded
  );
  PubSub.subscribe(
    "bitcraft_progressive_action_deleted",
    onPublicProgressiveActionStateDeleted
  );
}
