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
  actionsRequired: number;
}

export interface IBitcraftRecipesInit {
  type: "bitcraft_recipes_init";
  recipes: Array<IBitcraftRecipe>;
}

export interface IBitcraftRecipeAdded {
  type: "bitcraft_recipe_added";
  entity: IBitcraftRecipe;
}

export interface IBitcraftRecipeUpdated {
  type: "bitcraft_recipe_updated";
  oldEntity: IBitcraftRecipe;
  newEntity: IBitcraftRecipe;
}

export interface IBitcraftRecipeDeleted {
  type: "bitcraft_recipe_deleted";
  entity: IBitcraftRecipe;
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
  entity: IBitcraftItem;
}

export interface IBitcraftItemUpdated {
  type: "bitcraft_item_updated";
  oldEntity: IBitcraftItem;
  newEntity: IBitcraftItem;
}

export interface IBitcraftItemDeleted {
  type: "bitcraft_item_deleted";
  entity: IBitcraftItem;
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
  entity: IBitcraftAuctionOrder;
}

export interface IBitcraftBuyOrderUpdated {
  type: "bitcraft_buy_order_updated";
  oldEntity: IBitcraftAuctionOrder;
  newEntity: IBitcraftAuctionOrder;
}

export interface IBitcraftBuyOrderDeleted {
  type: "bitcraft_buy_order_deleted";
  entity: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrdersInit {
  type: "bitcraft_sell_orders_init";
  orders: Array<IBitcraftAuctionOrder>;
}

export interface IBitcraftSellOrderAdded {
  type: "bitcraft_sell_order_added";
  entity: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrderUpdated {
  type: "bitcraft_sell_order_updated";
  oldEntity: IBitcraftAuctionOrder;
  newEntity: IBitcraftAuctionOrder;
}

export interface IBitcraftSellOrderDeleted {
  type: "bitcraft_sell_order_deleted";
  entity: IBitcraftAuctionOrder;
}

export interface IBitcraftProgressiveActionState {
  id: string;
  buildingEntityId: string;
  ownerEntityId: string;
}

export interface IBitcraftProgressiveActionAdded {
  type: "bitcraft_progressive_action_added";
  entity: IBitcraftProgressiveActionState;
}

export interface IBitcraftProgressiveActionUpdated {
  type: "bitcraft_progressive_action_updated";
  oldEntity: IBitcraftProgressiveActionState;
  newEntity: IBitcraftProgressiveActionState;
}

export interface IBitcraftProgressiveActionDeleted {
  type: "bitcraft_progressive_action_deleted";
  entity: IBitcraftProgressiveActionState;
}

export interface IApplicationSharedCraftStarted {
  type: "application_shared_craft_started";
  id: string;
  claimName: string;
  effort: number;
  progress: number;
  user?: {
    id: string;
    username: string;
  };
  location?: {
    x: number;
    y: number;
    chunkIndex: string;
  };
  producedItems: Array<{
    id: string;
    name: string;
    description: string;
    tier: number;
    rarity: string;
  }>;
}
export interface IApplicationSharedCraftRemoved {
  type: "application_shared_craft_removed";
  id: string;
}
