import { RateLimitGuard } from './rate-limit.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockRedis: jest.Mocked<Redis>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    mockReflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockConfigService = {
      get: jest.fn()
        .mockReturnValueOnce('localhost') // redis host
        .mockReturnValueOnce(6379),       // redis port
    } as unknown as jest.Mocked<ConfigService>;

    mockRedis = {
      pipeline: jest.fn().mockReturnThis(),
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      pexpire: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      quit: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          ip: '127.0.0.1',
        }),
      }),
      getHandler: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Redis, useValue: mockRedis },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    // Replace the Redis instance with our mock
    (guard as any).redis = mockRedis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow request when no rate limit is set', async () => {
      mockReflector.get.mockReturnValue(undefined);
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow request when under rate limit', async () => {
      const options = { limit: 10, windowMs: 60000 };
      mockReflector.get.mockReturnValue(options);
      mockRedis.exec.mockResolvedValue([
        [null, 0],  // zremrangebyscore result
        [null, 5],   // zcard result (current count)
        [null, 1],   // zadd result
        [null, 1],   // pexpire result
      ]);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
      expect(mockRedis.zcard).toHaveBeenCalled();
      expect(mockRedis.zadd).toHaveBeenCalled();
      expect(mockRedis.pexpire).toHaveBeenCalled();
    });

    it('should throw HttpException when rate limit is exceeded', async () => {
      const options = { limit: 10, windowMs: 60000 };
      mockReflector.get.mockReturnValue(options);
      mockRedis.exec.mockResolvedValue([
        [null, 0],   // zremrangebyscore result
        [null, 11],  // zcard result (exceeds limit)
        [null, 1],   // zadd result
        [null, 1],   // pexpire result
      ]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Rate limit exceeded',
            message: 'You have exceeded the 10 requests in 60 seconds.',
            remaining: 0,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should allow request when Redis fails', async () => {
      const options = { limit: 10, windowMs: 60000 };
      mockReflector.get.mockReturnValue(options);
      mockRedis.exec.mockRejectedValue(new Error('Redis error'));

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow request when Redis pipeline returns null', async () => {
      const options = { limit: 10, windowMs: 60000 };
      mockReflector.get.mockReturnValue(options);
      mockRedis.exec.mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should use correct Redis key with IP address', async () => {
      const options = { limit: 10, windowMs: 60000 };
      mockReflector.get.mockReturnValue(options);
      mockRedis.exec.mockResolvedValue([
        [null, 0],
        [null, 5],
        [null, 1],
        [null, 1],
      ]);

      await guard.canActivate(mockContext);
      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        'rate-limit:127.0.0.1',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should initialize Redis with config values', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('bull.connection.host', 'localhost');
      expect(mockConfigService.get).toHaveBeenCalledWith('bull.connection.port', 6379);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close Redis connection', async () => {
      await guard.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});