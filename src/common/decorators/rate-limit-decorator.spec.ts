import { RateLimit, RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';
import { SetMetadata } from '@nestjs/common';

describe('RateLimit Decorator', () => {
  describe('RATE_LIMIT_KEY', () => {
    it('should be defined with correct value', () => {
      expect(RATE_LIMIT_KEY).toBe('rate_limit');
    });
  });

  describe('RateLimit Decorator', () => {
    it('should be a function', () => {
      expect(typeof RateLimit).toBe('function');
    });

    it('should return a decorator function', () => {
      const options = { limit: 10, windowMs: 60000 };
      const decorator = RateLimit(options);
      expect(typeof decorator).toBe('function');
    });

    it('should accept valid rate limit options', () => {
      const testCases = [
        { limit: 1, windowMs: 1000 },
        { limit: 10, windowMs: 60000 },
        { limit: 100, windowMs: 3600000 },
      ];

      testCases.forEach(options => {
        expect(() => RateLimit(options)).not.toThrow();
      });
    });
  });

  describe('Type Definitions', () => {
    it('should have correct RateLimitOptions interface', () => {
      const options: RateLimitOptions = { limit: 10, windowMs: 60000 };
      expect(options.limit).toBe(10);
      expect(options.windowMs).toBe(60000);
    });

    it('should enforce RateLimitOptions types', () => {
      // These tests are compile-time only - using @ts-expect-error to verify types
      // @ts-expect-error
      const invalid1: RateLimitOptions = { limit: '10', windowMs: 60000 };
      // @ts-expect-error
      const invalid2: RateLimitOptions = { limit: 10, windowMs: '60000' };
      // @ts-expect-error
      const invalid3: RateLimitOptions = { limit: 10 }; // missing windowMs
      // @ts-expect-error
      const invalid4: RateLimitOptions = { windowMs: 60000 }; // missing limit

      expect(true).toBe(true); // Just to have an assertion
    });
  });
});
