import { registerApplicationSubscribers } from "@src/application/subscribers";
import { CommandBusImpl } from "./bus";
import type {
  IBitcraftBuyOrderAdded,
  IBitcraftBuyOrderDeleted,
  IBitcraftBuyOrdersInit,
  IBitcraftBuyOrderUpdated,
  IBitcraftChatMessageEvent,
  IBitcraftItemAdded,
  IBitcraftItemDeleted,
  IBitcraftItemsInit,
  IBitcraftItemUpdated,
  IBitcraftRecipeAdded,
  IBitcraftRecipeDeleted,
  IBitcraftRecipesInit,
  IBitcraftRecipeUpdated,
  IBitcraftSellOrderAdded,
  IBitcraftSellOrderDeleted,
  IBitcraftSellOrdersInit,
  IBitcraftSellOrderUpdated,
  IBitcraftUserModeratedEvent,
} from "./events";
import { PubSubBuilder } from "./pubsub";

export const CommandBus = new CommandBusImpl();
export const QueryBus = new CommandBusImpl();

export { CommandBase } from "./command";

export * from "./events";

// This is overengineered for a single process application, but I want to leave the door open
// to completely separating the bot from the process connected to bitcraft.
const builder = new PubSubBuilder()
  .withEvent<
    "bitcraft_chat_message",
    IBitcraftChatMessageEvent
  >("bitcraft_chat_message")
  .withEvent<
    "bitcraft_user_moderated",
    IBitcraftUserModeratedEvent
  >("bitcraft_user_moderated")
  .withEvent<"bitcraft_items_init", IBitcraftItemsInit>("bitcraft_items_init")
  .withEvent<"bitcraft_item_added", IBitcraftItemAdded>("bitcraft_item_added")
  .withEvent<
    "bitcraft_item_updated",
    IBitcraftItemUpdated
  >("bitcraft_item_updated")
  .withEvent<
    "bitcraft_item_deleted",
    IBitcraftItemDeleted
  >("bitcraft_item_deleted")
  .withEvent<
    "bitcraft_recipes_init",
    IBitcraftRecipesInit
  >("bitcraft_recipes_init")
  .withEvent<
    "bitcraft_recipe_added",
    IBitcraftRecipeAdded
  >("bitcraft_recipe_added")
  .withEvent<
    "bitcraft_recipe_updated",
    IBitcraftRecipeUpdated
  >("bitcraft_recipe_updated")
  .withEvent<
    "bitcraft_recipe_deleted",
    IBitcraftRecipeDeleted
  >("bitcraft_recipe_deleted")
  .withEvent<
    "bitcraft_buy_orders_init",
    IBitcraftBuyOrdersInit
  >("bitcraft_buy_orders_init")
  .withEvent<
    "bitcraft_buy_order_added",
    IBitcraftBuyOrderAdded
  >("bitcraft_buy_order_added")
  .withEvent<
    "bitcraft_buy_order_updated",
    IBitcraftBuyOrderUpdated
  >("bitcraft_buy_order_updated")
  .withEvent<
    "bitcraft_buy_order_deleted",
    IBitcraftBuyOrderDeleted
  >("bitcraft_buy_order_deleted")
  .withEvent<
    "bitcraft_sell_orders_init",
    IBitcraftSellOrdersInit
  >("bitcraft_sell_orders_init")
  .withEvent<
    "bitcraft_sell_order_added",
    IBitcraftSellOrderAdded
  >("bitcraft_sell_order_added")
  .withEvent<
    "bitcraft_sell_order_updated",
    IBitcraftSellOrderUpdated
  >("bitcraft_sell_order_updated")
  .withEvent<
    "bitcraft_sell_order_deleted",
    IBitcraftSellOrderDeleted
  >("bitcraft_sell_order_deleted");

export const PubSub = builder.build();
registerApplicationSubscribers();
