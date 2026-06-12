import { API_KEY_SET } from '../constants/redisKeys.js';

export interface ApiKeyRedis {
  eval(script: string, keyCount: number, ...args: Array<string | number>): Promise<unknown>;
  sismember(key: string, member: string): Promise<number>;
}

const SEED_API_KEYS_SCRIPT = `
redis.call('DEL', KEYS[1])
for i = 1, #ARGV do
  redis.call('SADD', KEYS[1], ARGV[i])
end
return #ARGV
`;

export class ApiKeyRepository {
  constructor(private readonly redis: ApiKeyRedis) {}

  async seed(apiKeys: string[]): Promise<number> {
    const result = await this.redis.eval(SEED_API_KEYS_SCRIPT, 1, API_KEY_SET, ...apiKeys);
    return Number(result);
  }

  async has(apiKey: string): Promise<boolean> {
    const result = await this.redis.sismember(API_KEY_SET, apiKey);
    return result === 1;
  }
}
