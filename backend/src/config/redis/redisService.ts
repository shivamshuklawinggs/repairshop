
import redisClient from './redisClient';


class RedisService {
  async set({key, value, ttl =300}: {key: string, value: any, ttl?: number}): Promise<void> {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, { EX: ttl });
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async del(key: string): Promise<number> {
    return await redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  }

  async flushAll(): Promise<void> {
    await redisClient.flushAll();
  }
  async getAll(): Promise<void> {
    await redisClient.hGetAll("report");
  }

  async incr(key: string): Promise<number> {
    return await redisClient.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await redisClient.expire(key, ttl);
  }
    async  scanKeys(pattern: string): Promise<string[]> {
    let cursor = "0";
    let allKeys = [];

    do {
    const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = reply.cursor;
    const keys = reply.keys;

    allKeys.push(...keys);
    } while (cursor !== "0");

    return allKeys;
    }

    async deleteMatchingKeys(pattern: string): Promise<number> {
    const keys = await this.scanKeys(pattern);
    if (keys.length === 0) return 0;

    const deletedCount = await redisClient.del(keys.map(key => key.toString()));
    return deletedCount;
    }
 
 


}

export default new RedisService();

