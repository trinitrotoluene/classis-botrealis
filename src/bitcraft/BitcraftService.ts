import type {
  AuctionListingState,
  ChatMessageState,
  DbConnection,
  EventContext,
  UserModerationState,
} from "@src/bindings";
import { logger } from "@src/logger";
import { BitcraftClient } from "./BitcraftClient";
import { Config } from "@src/config";
import { subscribeAsync } from "./subscribeAsync";
import { PubSub, type IBitcraftAuctionOrder } from "@src/framework";
import { mapRecipe } from "./mapRecipe";
import { mapItem } from "./mapItem";

function mapAuctionListingState(
  order: AuctionListingState
): IBitcraftAuctionOrder {
  return {
    id: order.entityId.toString(),
    ownerId: order.ownerEntityId.toString(),
    claimId: order.claimEntityId.toString(),
    price: order.priceThreshold,
    quantity: order.quantity,
    storedCoins: order.storedCoins,
    itemId: order.itemId,
  };
}

export class BitcraftService {
  constructor(
    private readonly client: BitcraftClient,
    private readonly conn: DbConnection
  ) {
    conn.db.chatMessageState.onInsert(this.handleChatMessageStateInsert);
    conn.db.userModerationState.onInsert(this.handleUserModerationStateInsert);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static instance: BitcraftService = undefined as any;

  static start(): Promise<BitcraftService> {
    logger.debug("Starting bitcraft service");

    if (!Config.bitcraft.authToken) {
      throw new Error("Bitcraft authToken is not configured");
    }

    const client = new BitcraftClient(
      Config.bitcraft.uri,
      Config.bitcraft.module,
      Config.bitcraft.authToken
    );

    const promise = new Promise<BitcraftService>((resolve, reject) => {
      client.onConnected.subscribe((x) => {
        const service = new BitcraftService(client, x.conn);
        BitcraftService.instance = service;
        resolve(service);
      });

      client.onConnectionError.subscribe((err) => reject(err));
      client.connect();
    });

    return promise;
  }

  public async createBaseSubscriptions() {
    const now = Math.floor(Date.now() / 1000);

    await subscribeAsync(this.conn, [
      "SELECT * from item_desc",
      "SELECT * from crafting_recipe_desc",
      "SELECT * from building_desc",
      "SELECT t.* from claim_state t WHERE t.neutral = FALSE",
      "SELECT * from player_username_state",
      `SELECT t.* from chat_message_state t WHERE t.channel_id >= 0 AND t.timestamp > ${now}`,
      `SELECT t.* from user_moderation_state t WHERE t.created_time > '${new Date().toISOString()}'`,
      `SELECT * from buy_order_state`,
      `SELECT * from sell_order_state`,
    ]);

    // Listen for changes to item_desc
    this.conn.db.itemDesc.onInsert((_, row) =>
      PubSub.publish("bitcraft_item_added", {
        type: "bitcraft_item_added",
        item: mapItem(row),
      })
    );

    this.conn.db.itemDesc.onUpdate((_, oldItem, newItem) =>
      PubSub.publish("bitcraft_item_updated", {
        type: "bitcraft_item_updated",
        oldItem: mapItem(oldItem),
        newItem: mapItem(newItem),
      })
    );

    this.conn.db.itemDesc.onDelete((_, row) =>
      PubSub.publish("bitcraft_item_deleted", {
        type: "bitcraft_item_deleted",
        id: row.id,
      })
    );

    // Publish its current state
    const items = [...this.conn.db.itemDesc.iter()];
    PubSub.publish("bitcraft_items_init", {
      type: "bitcraft_items_init",
      items: items.map(mapItem),
    });

    // Listen for changes to crafting_recipe_desc
    this.conn.db.craftingRecipeDesc.onInsert((_, recipe) =>
      PubSub.publish("bitcraft_recipe_added", {
        type: "bitcraft_recipe_added",
        recipe: mapRecipe(recipe),
      })
    );

    this.conn.db.craftingRecipeDesc.onUpdate((_, oldRecipe, newRecipe) =>
      PubSub.publish("bitcraft_recipe_updated", {
        type: "bitcraft_recipe_updated",
        oldRecipe: mapRecipe(oldRecipe),
        newRecipe: mapRecipe(newRecipe),
      })
    );

    this.conn.db.craftingRecipeDesc.onDelete((_, recipe) =>
      PubSub.publish("bitcraft_recipe_deleted", {
        type: "bitcraft_recipe_deleted",
        id: recipe.id,
      })
    );

    const recipes = [...this.conn.db.craftingRecipeDesc.iter()];
    PubSub.publish("bitcraft_recipes_init", {
      type: "bitcraft_recipes_init",
      recipes: recipes.map(mapRecipe),
    });

    this.conn.db.buyOrderState.onInsert((_, order) =>
      PubSub.publish("bitcraft_buy_order_added", {
        type: "bitcraft_buy_order_added",
        order: mapAuctionListingState(order),
      })
    );

    this.conn.db.buyOrderState.onUpdate((_, oldOrder, newOrder) =>
      PubSub.publish("bitcraft_buy_order_updated", {
        type: "bitcraft_buy_order_updated",
        oldOrder: mapAuctionListingState(oldOrder),
        newOrder: mapAuctionListingState(newOrder),
      })
    );

    this.conn.db.buyOrderState.onDelete((_, order) =>
      PubSub.publish("bitcraft_buy_order_deleted", {
        type: "bitcraft_buy_order_deleted",
        order: mapAuctionListingState(order),
      })
    );

    const buyOrders = [...this.conn.db.buyOrderState.iter()];
    PubSub.publish("bitcraft_buy_orders_init", {
      type: "bitcraft_buy_orders_init",
      orders: buyOrders.map(mapAuctionListingState),
    });

    this.conn.db.sellOrderState.onInsert((_, order) =>
      PubSub.publish("bitcraft_sell_order_added", {
        type: "bitcraft_sell_order_added",
        order: mapAuctionListingState(order),
      })
    );

    this.conn.db.sellOrderState.onUpdate((_, oldOrder, newOrder) =>
      PubSub.publish("bitcraft_sell_order_updated", {
        type: "bitcraft_sell_order_updated",
        oldOrder: mapAuctionListingState(oldOrder),
        newOrder: mapAuctionListingState(newOrder),
      })
    );

    this.conn.db.sellOrderState.onDelete((_, order) =>
      PubSub.publish("bitcraft_sell_order_deleted", {
        type: "bitcraft_sell_order_deleted",
        order: mapAuctionListingState(order),
      })
    );

    const sellOrders = [...this.conn.db.sellOrderState.iter()];
    PubSub.publish("bitcraft_sell_orders_init", {
      type: "bitcraft_sell_orders_init",
      orders: sellOrders.map(mapAuctionListingState),
    });
  }

  public async createClaimSubscription(claimId: string) {
    const barterStalls = [...this.conn.db.buildingDesc.iter()].filter((x) =>
      x.name.includes("Barter Stall")
    );

    await subscribeAsync(
      this.conn,
      `SELECT b.* FROM building_state b 
       JOIN building_desc d ON b.building_description_id = d.id 
          WHERE b.claim_entity_id = '${claimId}' 
            AND (
              ${barterStalls.map((x) => `d.name = '${x.name}'`).join(" OR ")}
            )`
    );
  }

  public searchClaims(searchTerm: string, limit = 10) {
    const claims = [...this.conn.db.claimState.iter()];
    return claims
      .filter((x) => x.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, limit);
  }

  public getClaim(id: string) {
    const claims = [...this.conn.db.claimState.iter()];
    return claims.find((x) => x.entityId.toString() === id);
  }

  public searchItems(searchTerm: string, limit = 10) {
    const itemDesc = [...this.conn.db.itemDesc.iter()];
    return itemDesc
      .filter((x) => x.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, limit);
  }

  private handleChatMessageStateInsert(_: EventContext, row: ChatMessageState) {
    PubSub.publish("bitcraft_chat_message", {
      type: "bitcraft_chat_message",
      channelId: row.channelId,
      messageId: row.entityId.toString(),
      senderId: row.ownerEntityId.toString(),
      senderUsername: row.username,
      content: row.text,
    });
  }

  private handleUserModerationStateInsert(
    _: EventContext,
    row: UserModerationState
  ) {
    PubSub.publish("bitcraft_user_moderated", {
      type: "bitcraft_user_moderated",
      targetId: row.targetEntityId.toString(),
      createdByEntityId: row.createdByEntityId.toString(),
      userModerationPolicy: row.userModerationPolicy.tag,
      createdAt: row.createdTime.toDate(),
      expiresAt: row.expirationTime.toDate(),
    });
  }
}
