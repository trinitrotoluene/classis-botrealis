/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AuctionListingState,
  ChatMessageState,
  DbConnection,
  EventContext,
  PublicProgressiveActionState,
  UserModerationState,
} from "@src/bindings";
import { logger } from "@src/logger";
import { BitcraftClient } from "./BitcraftClient";
import { Config } from "@src/config";
import { subscribeAsync } from "./subscribeAsync";
import {
  PubSub,
  type IBitcraftAuctionOrder,
  type IBitcraftProgressiveActionState,
  type TPubSubEventNames,
  type TPubSubEventType,
} from "@src/framework";
import { mapRecipe } from "./mapRecipe";
import { mapItem } from "./mapItem";
import type { TableCache } from "@clockworklabs/spacetimedb-sdk";

type ValidPrefixes<T extends string> = T extends
  | `${infer Prefix}_added`
  | `${infer Prefix}_updated`
  | `${infer Prefix}_deleted`
  ? Prefix
  : never;

type ExtractRowType<TTable> = TTable extends {
  tableCache: TableCache<infer TRowType>;
}
  ? TRowType
  : never;

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

function mapPublicProgressiveActionState(
  action: PublicProgressiveActionState
): IBitcraftProgressiveActionState {
  return {
    id: action.entityId.toString(),
    buildingEntityId: action.buildingEntityId.toString(),
    ownerEntityId: action.ownerEntityId.toString(),
  };
}

export class BitcraftService {
  private readonly subscribedClaims: Set<string>;

  constructor(
    private readonly client: BitcraftClient,
    private readonly conn: DbConnection
  ) {
    this.subscribedClaims = new Set();
  }

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
      client.onConnected.subscribe(async (x) => {
        const service = new BitcraftService(client, x.conn);
        BitcraftService.instance = service;

        await service.createBaseSubscriptions();

        resolve(service);
      });

      client.onConnectionError.subscribe((err) => reject(err));
      client.connect();
    });

    return promise;
  }

  registerEventHandlersFor<
    TPrefix extends ValidPrefixes<TPubSubEventNames>,
    TTable extends {
      onInsert: (cb: (ctx: unknown, entity: any) => void) => void;
      onUpdate: (
        cb: (ctx: unknown, oldEntity: any, newEntity: any) => void
      ) => void;
      onDelete: (cb: (ctx: unknown, entity: any) => void) => void;
    },
  >(
    prefix: TPrefix,
    table: TTable,
    mapper: (
      entity: ExtractRowType<TTable>
    ) => TPubSubEventType<`${TPrefix}_added`> extends {
      entity: infer TMappedEntity;
    }
      ? TMappedEntity
      : never,
    config?: {
      exclude: { insert?: boolean; update?: boolean; delete?: boolean };
    }
  ) {
    if (!config || !config.exclude.insert) {
      table.onInsert((_, row) =>
        PubSub.publish(`${prefix}_added`, {
          type: `${prefix}_added`,
          entity: mapper(row),
        } as any)
      );
    }

    if (!config || !config.exclude.update) {
      table.onUpdate((_, oldItem, newItem) =>
        PubSub.publish(`${prefix}_updated`, {
          type: `${prefix}_updated`,
          oldEntity: mapper(oldItem),
          newEntity: mapper(newItem),
        } as any)
      );
    }

    if (!config || !config.exclude.delete) {
      table.onDelete((_, row) =>
        PubSub.publish(`${prefix}_deleted`, {
          type: `${prefix}_deleted`,
          entity: mapper(row),
        } as any)
      );
    }
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
      "SELECT * from building_state",
      `SELECT s.* FROM progressive_action_state s
INNER JOIN public_progressive_action_state p
  ON s.entity_id = p.entity_id
WHERE s.craft_count > 50`,
      `SELECT p.* FROM public_progressive_action_state p
JOIN progressive_action_state s
ON p.entity_id = s.entity_id
  WHERE s.craft_count > 50`,
    ]);

    // Register bulk init handlers
    const items = [...this.conn.db.itemDesc.iter()];
    PubSub.publish("bitcraft_items_init", {
      type: "bitcraft_items_init",
      items: items.map(mapItem),
    });

    const recipes = [...this.conn.db.craftingRecipeDesc.iter()];
    PubSub.publish("bitcraft_recipes_init", {
      type: "bitcraft_recipes_init",
      recipes: recipes.map(mapRecipe),
    });

    const buyOrders = [...this.conn.db.buyOrderState.iter()];
    PubSub.publish("bitcraft_buy_orders_init", {
      type: "bitcraft_buy_orders_init",
      orders: buyOrders.map(mapAuctionListingState),
    });

    const sellOrders = [...this.conn.db.sellOrderState.iter()];
    PubSub.publish("bitcraft_sell_orders_init", {
      type: "bitcraft_sell_orders_init",
      orders: sellOrders.map(mapAuctionListingState),
    });

    // Register CRUD handlers
    this.registerEventHandlersFor(
      "bitcraft_item",
      this.conn.db.itemDesc,
      mapItem
    );
    this.registerEventHandlersFor(
      "bitcraft_recipe",
      this.conn.db.craftingRecipeDesc,
      mapRecipe
    );
    this.registerEventHandlersFor(
      "bitcraft_buy_order",
      this.conn.db.buyOrderState,
      mapAuctionListingState
    );
    this.registerEventHandlersFor(
      "bitcraft_sell_order",
      this.conn.db.sellOrderState,
      mapAuctionListingState
    );

    this.registerEventHandlersFor(
      "bitcraft_progressive_action",
      this.conn.db.publicProgressiveActionState,
      mapPublicProgressiveActionState,
      { exclude: { update: true } }
    );

    // Ad-hoc stuff
    this.conn.db.chatMessageState.onInsert(this.handleChatMessageStateInsert);
    this.conn.db.userModerationState.onInsert(
      this.handleUserModerationStateInsert
    );
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

  public async oneOffLocationSubscription(entityId: string) {
    const { unsubscribe } = await subscribeAsync(
      this.conn,
      `SELECT * from location_state WHERE entity_id = '${entityId}'`
    );

    try {
      for (const location of this.conn.db.locationState.iter()) {
        if (location.entityId.toString() === entityId) {
          return location;
        }
      }
    } finally {
      unsubscribe();
    }
  }

  public searchClaims(searchTerm: string, limit = 10) {
    const claims = [...this.conn.db.claimState.iter()];
    return claims
      .filter((x) => x.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, limit);
  }

  public getClaim(id: string) {
    for (const claim of this.conn.db.claimState.iter()) {
      if (claim.entityId.toString() === id) {
        return claim;
      }
    }
  }

  public getBuildingState(id: string) {
    for (const building of this.conn.db.buildingState.iter()) {
      if (building.entityId.toString() === id) {
        return building;
      }
    }
  }

  public getProgressiveActionState(entityId: string) {
    for (const action of this.conn.db.progressiveActionState.iter()) {
      if (action.entityId.toString() === entityId) {
        return action;
      }
    }
  }

  public getUser(entityId: string) {
    for (const user of this.conn.db.playerUsernameState.iter()) {
      if (user.entityId.toString() === entityId) {
        return user;
      }
    }
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
    const targetUser = this.getUser(row.targetEntityId.toString());

    PubSub.publish("bitcraft_user_moderated", {
      type: "bitcraft_user_moderated",
      target: {
        id: row.targetEntityId.toString(),
        username: targetUser?.username,
      },
      createdByEntityId: row.createdByEntityId.toString(),
      userModerationPolicy: row.userModerationPolicy.tag,
      createdAt: row.createdTime.toDate(),
      expiresAt: row.expirationTime.toDate(),
    });
  }
}
