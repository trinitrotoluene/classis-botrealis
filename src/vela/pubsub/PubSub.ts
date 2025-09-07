import { logger } from "@src/logger";
import type { Envelope, TRedisChannels, UpdateEnvelope } from "./types";
import type { BitcraftUsernameState, TAllEntityMap } from "../__generated__";
import { getRedisSubscriber } from "../redis/redisClient";
import { CacheClient } from "../cache";

export interface IEventContext {
  player?: BitcraftUsernameState;
  module: string;
}

export type SubscriberHandler<T extends string> = T extends `${string}.update`
  ? (context: IEventContext, oldVal: Entity<T>, newVal: Entity<T>) => void
  : (context: IEventContext, val: Entity<T>) => void;

type Entity<T extends string> = T extends `${string}.${infer TEntity}.${string}`
  ? TEntity extends keyof TAllEntityMap
    ? TAllEntityMap[TEntity]
    : unknown
  : T extends `${string}.${infer TEntity}`
    ? TEntity extends keyof TAllEntityMap
      ? TAllEntityMap[TEntity]
      : unknown
    : unknown;

export class PubSubImpl {
  private readonly _subscribers: Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => void | Promise<void>
  >;

  constructor() {
    this._subscribers = new Map();
    getRedisSubscriber().on("pmessage", this.handleMessage.bind(this));
  }

  async handleMessage(_pattern: string, channel: string, message: string) {
    const subscriber = this._subscribers.get(channel);
    if (!subscriber) {
      return;
    }

    const parsedData = JSON.parse(message) as
      | Envelope<unknown>
      | UpdateEnvelope<unknown>;

    const userState = await CacheClient.getAll(
      "BitcraftUserState",
      parsedData.Module,
    );

    const identity = userState.get(parsedData.CallerIdentity);
    const player = await CacheClient.getByIdGlobal(
      "BitcraftUsernameState",
      identity?.UserEntityId ?? "",
    );

    logger.info(`Parsed pub/sub message on channel ${channel}`, {
      channel,
      module: parsedData.Module,
      version: parsedData.Version,
      player: player,
    });

    const context: IEventContext = { player, module: parsedData.Module };

    if ("Entity" in parsedData) {
      await subscriber(context, parsedData.Entity);
    } else {
      await subscriber(context, parsedData.OldEntity, parsedData.NewEntity);
    }
  }

  async subscribe<TChannel extends TRedisChannels>(
    channel: TChannel,
    handler: SubscriberHandler<TChannel>,
  ) {
    logger.info(`Registered subscriber for channel ${channel}`);
    this._subscribers.set(channel, handler);
  }
}
