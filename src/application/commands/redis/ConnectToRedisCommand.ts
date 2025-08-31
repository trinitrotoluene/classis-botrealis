import { CommandBase } from "@src/framework";
import { logger } from "@src/logger";
import { connectRedis } from "@src/vela";
import { getRedisSubscriber } from "@src/vela/redis/redisClient";

export default class ConnectToRedisCommand extends CommandBase<
  object,
  undefined
> {
  async execute() {
    logger.info("Connecting to redis");

    await connectRedis();
    await getRedisSubscriber().psubscribe("*");

    logger.info("Connected!");
    return undefined;
  }
}
