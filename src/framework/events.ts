export enum ChannelId {
  Local = 2,
  Region = 3,
  Empire = 5,
}

export interface IBitcraftChatMessageEvent {
  type: "bitcraft_chat_message";
  channelId: ChannelId;
  messageId: string;
  senderId: string;
  senderUsername: string;
  content: string;
}

export interface IBitcraftUserModeratedEvent {
  type: "bitcraft_user_moderated";
  targetId: string;
  createdByEntityId: string;
  userModerationPolicy: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IBitcraftRecipe {
  id: number;
  nameFormatString: string;
  buildingRequirement?: {
    buildingType: number;
    tier: number;
  };
  levelRequirements: Array<{
    skillId: number;
    level: number;
  }>;
  toolRequirements: Array<{
    toolType: number;
    level: number;
  }>;
  consumedItemStacks: Array<{
    itemId: number;
    quantity: number;
  }>;
  producedItemStacks: Array<{
    itemId: number;
    quantity: number;
  }>;
  isPassive: boolean;
}

export interface IBitcraftRecipesInit {
  type: "bitcraft_recipes_init";
  recipes: Array<IBitcraftRecipe>;
}

export interface IBitcraftRecipeAdded {
  type: "bitcraft_recipe_added";
  recipe: IBitcraftRecipe;
}

export interface IBitcraftRecipeUpdated {
  type: "bitcraft_recipe_updated";
  oldRecipe: IBitcraftRecipe;
  newRecipe: IBitcraftRecipe;
}

export interface IBitcraftRecipeDeleted {
  type: "bitcraft_recipe_deleted";
  id: number;
}

export interface IBitcraftItem {
  id: number;
  name: string;
  description: string | undefined;
  volume: number;
  tier: number;
  rarity:
    | "Default"
    | "Common"
    | "Uncommon"
    | "Rare"
    | "Epic"
    | "Legendary"
    | "Mythic";
  itemListId: number;
  hasCompendiumEntry: boolean;
}
export interface IBitcraftItemsInit {
  type: "bitcraft_items_init";
  items: Array<IBitcraftItem>;
}

export interface IBitcraftItemAdded {
  type: "bitcraft_item_added";
  item: IBitcraftItem;
}

export interface IBitcraftItemUpdated {
  type: "bitcraft_item_updated";
  oldItem: IBitcraftItem;
  newItem: IBitcraftItem;
}

export interface IBitcraftItemDeleted {
  type: "bitcraft_item_deleted";
  id: number;
}

export interface IBitcraftAuctionOrder {
  id: string;
  ownerId: string;
  claimId: string;
  price: number;
  quantity: number;
  storedCoins?: number;
  itemId: number;
}

export interface IBitcraftBuyOrdersInit {
  type: "bitcraft_buy_orders_init";
  orders: Array<IBitcraftAuctionOrder>;
}

export interface IBitcraftBuyOrderAdded {
  type: "bitcraft_buy_order_added";
  order: IBitcraftAuctionOrder;
}

export interface IBitcraftBuyOrderUpdated {
  type: "bitcraft_buy_order_updated";
  oldOrder: IBitcraftAuctionOrder;
  newOrder: IBitcraftAuctionOrder;
}

export interface IBitcraftBuyOrderDeleted {
  type: "bitcraft_buy_order_deleted";
  order: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrdersInit {
  type: "bitcraft_sell_orders_init";
  orders: Array<IBitcraftAuctionOrder>;
}

export interface IBitcraftSellOrderAdded {
  type: "bitcraft_sell_order_added";
  order: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrderUpdated {
  type: "bitcraft_sell_order_updated";
  oldOrder: IBitcraftAuctionOrder;
  newOrder: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrderDeleted {
  type: "bitcraft_sell_order_deleted";
  order: IBitcraftAuctionOrder;
}
