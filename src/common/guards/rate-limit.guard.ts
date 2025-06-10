import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const redisHost = this.configService.get<string>('bull.connection.host', 'localhost');
    const redisPort = this.configService.get<number>('bull.connection.port', 6379);
    this.redis = new Redis({ host: redisHost, port: redisPort });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true; // No rate limit applied
    }

    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const { limit, windowMs } = options;

    return this.handleRateLimit(ip, limit, windowMs);
  }

  private async handleRateLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const key = `rate-limit:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart); // Remove old requests
      pipeline.zcard(key); // Count requests in window
      pipeline.zadd(key, now, now.toString()); // Add new request
      pipeline.pexpire(key, windowMs); // Set expiration

      const execResult = await pipeline.exec();
      if (!execResult) {
        // Redis connection issue, allow request to prevent blocking
        console.error('Rate limit error: Redis pipeline.exec() returned null');
        return true;
      }
      const [, count] = execResult;
      const currentCount = count[1] as number;

      if (currentCount > maxRequests) {
        throw new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Rate limit exceeded',
            message: `You have exceeded the ${maxRequests} requests in ${windowMs / 1000} seconds.`,
            remaining: 0,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error:any) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Log error and allow request to prevent blocking on Redis failure
      console.error(`Rate limit error: ${error.message}`);
      return true;
    }
  }

  // Cleanup on application shutdown
  async onModuleDestroy() {
    await this.redis.quit();
  }
}