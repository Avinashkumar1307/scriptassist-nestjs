import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly namespace: string;
  private readonly defaultTTL: number;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService) {
    const redisHost = this.configService.get<string>('bull.connection.host', 'localhost');
    const redisPort = this.configService.get<number>('bull.connection.port', 6379);
    this.redis = new Redis({ host: redisHost, port: redisPort });
    this.namespace = this.configService.get<string>('cache.namespace', 'taskflow');
    this.defaultTTL = this.configService.get<number>('cache.defaultTTL', 300); // 5 minutes
    this.logger.log(`CacheService initialized with Redis at ${redisHost}:${redisPort}`);
  }

  async set<T>(key: string, value: T, ttlSeconds: number = this.defaultTTL): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key');
    }
    const namespacedKey = `${this.namespace}:${key}`;
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.set(namespacedKey, serializedValue, 'EX', ttlSeconds);
      this.logger.debug(`Cache set: ${namespacedKey} (TTL: ${ttlSeconds}s)`);
    } catch (error:any) {
      this.logger.error(`Failed to set cache for ${namespacedKey}: ${error.message}`);
      throw new Error(`Cache set failed: ${error.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key');
    }
    const namespacedKey = `${this.namespace}:${key}`;
    try {
      const value = await this.redis.get(namespacedKey);
      if (value === null) {
        this.logger.debug(`Cache miss: ${namespacedKey}`);
        return null;
      }
      const deserializedValue = JSON.parse(value) as T;
      this.logger.debug(`Cache hit: ${namespacedKey}`);
      return deserializedValue;
    } catch (error:any) {
      this.logger.error(`Failed to get cache for ${namespacedKey}: ${error.message}`);
      throw new Error(`Cache get failed: ${error.message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key');
    }
    const namespacedKey = `${this.namespace}:${key}`;
    try {
      const result = await this.redis.del(namespacedKey);
      const deleted = result > 0;
      this.logger.debug(`Cache delete: ${namespacedKey} (Deleted: ${deleted})`);
      return deleted;
    } catch (error:any) {
      this.logger.error(`Failed to delete cache for ${namespacedKey}: ${error.message}`);
      throw new Error(`Cache delete failed: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:*`);
      if (keys.length > 0) {
        await this.redis.del(keys);
        this.logger.log(`Cache cleared: ${keys.length} keys removed`);
      } else {
        this.logger.debug('Cache clear: No keys found');
      }
    } catch (error:any) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
      throw new Error(`Cache clear failed: ${error.message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key');
    }
    const namespacedKey = `${this.namespace}:${key}`;
    try {
      const exists = await this.redis.exists(namespacedKey);
      const hasKey = exists > 0;
      this.logger.debug(`Cache has: ${namespacedKey} (Exists: ${hasKey})`);
      return hasKey;
    } catch (error:any) {
      this.logger.error(`Failed to check cache for ${namespacedKey}: ${error.message}`);
      throw new Error(`Cache check failed: ${error.message}`);
    }
  }

  async bulkSet<T>(items: { key: string; value: T; ttlSeconds?: number }[]): Promise<void> {
    if (!items.every(item => item.key && typeof item.key === 'string')) {
      throw new Error('Invalid cache keys in bulk set');
    }
    try {
      const pipeline = this.redis.pipeline();
      for (const { key, value, ttlSeconds = this.defaultTTL } of items) {
        const namespacedKey = `${this.namespace}:${key}`;
        const serializedValue = JSON.stringify(value);
        pipeline.set(namespacedKey, serializedValue, 'EX', ttlSeconds);
      }
      await pipeline.exec();
      this.logger.debug(`Bulk set: ${items.length} keys`);
    } catch (error:any) {
      this.logger.error(`Failed to bulk set cache: ${error.message}`);
      throw new Error(`Bulk set failed: ${error.message}`);
    }
  }

  async bulkGet<T>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.every(key => key && typeof key === 'string')) {
      throw new Error('Invalid cache keys in bulk get');
    }
    const namespacedKeys = keys.map(key => `${this.namespace}:${key}`);
    try {
      const values = await this.redis.mget(namespacedKeys);
      const results = values.map(value => (value ? JSON.parse(value) : null)) as (T | null)[];
      this.logger.debug(`Bulk get: ${keys.length} keys (${results.filter(v => v !== null).length} hits)`);
      return results;
    } catch (error:any) {
      this.logger.error(`Failed to bulk get cache: ${error.message}`);
      throw new Error(`Bulk get failed: ${error.message}`);
    }
  }

  async getStats(): Promise<{ keys: number; memoryUsageBytes: number }> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:*`);
      const info = await this.redis.info('memory');
      const memoryUsageBytes = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0', 10);
      this.logger.debug(`Cache stats: ${keys.length} keys, ${memoryUsageBytes} bytes`);
      return { keys: keys.length, memoryUsageBytes };
    } catch (error:any) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      throw new Error(`Cache stats failed: ${error.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (error:any) {
      this.logger.error(`Failed to close Redis connection: ${error.message}`);
    }
  }
}