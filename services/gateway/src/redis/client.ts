import { Redis } from 'ioredis';

export type GatewayRedis = Redis;

export const createRedisClient = (url: string): GatewayRedis =>
  new Redis(url, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 2
  });

export const closeRedisClient = async (redis: GatewayRedis): Promise<void> => {
  redis.disconnect(false);
};
