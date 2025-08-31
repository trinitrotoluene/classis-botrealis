import { logger } from "@src/logger";
import type { Envelope, TRedisChannels, UpdateEnvelope } from "./types";
import type { TAllEntityMap } from "../__generated__";
import { getRedisSubscriber } from "../redis/redisClient";

type SubscriberHandler<T extends string> = T extends `${string}.update`
  ? (oldVal: Entity<T>, newVal: Entity<T>) => void
  : (val: Entity<T>) => void;

type Entity<T extends string> = T extends `${string}.${infer TEntity}.${string}`
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

    logger.info(`Parsed pub/sub message on channel ${channel}`, {
      channel,
      module: parsedData.Module,
      version: parsedData.Version,
    });

    if ("Entity" in parsedData) {
      await subscriber(parsedData.Entity);
    } else {
      await subscriber(parsedData.OldEntity, parsedData.NewEntity);
    }
  }

  async subscribe<TChannel extends TRedisChannels>(
    channel: TChannel,
    handler: SubscriberHandler<TChannel>
  ) {
    logger.info(`Registered subscriber for channel ${channel}`);
    this._subscribers.set(channel, handler);
  }
}
