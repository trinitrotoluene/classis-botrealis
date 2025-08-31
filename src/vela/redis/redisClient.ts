import { Config } from "@src/config";
import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: Config.redis.host,
      port: Config.redis.port,
      lazyConnect: true,
    });
  }
  return redis;
}

let redisSubscriber: Redis | null = null;

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = new Redis({
      host: Config.redis.host,
      port: Config.redis.port,
      lazyConnect: true,
    });
  }
  return redisSubscriber;
}

export async function connectRedis() {
  const client = getRedis();
  const subscriber = getRedisSubscriber();

  if (!client.status || client.status !== "ready") {
    await client.connect();
  }

  if (!subscriber.status || subscriber.status !== "ready") {
    await subscriber.connect();
  }
}

export async function disconnectRedis() {
  if (redis) {
    redis.disconnect();
    redis = null;
  }

  if (redisSubscriber) {
    redisSubscriber.disconnect();
    redisSubscriber = null;
  }
}
