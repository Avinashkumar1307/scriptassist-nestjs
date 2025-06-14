import { AdminGuard } from './admin.guard';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable, of } from 'rxjs';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for admin user', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'admin' }
          })
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'user' }
          })
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return false for missing user', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({})
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return false for missing role', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {}
          })
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should work with Promise return type', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'admin' }
          })
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(Promise.resolve(result)).resolves.toBe(true);
    });

    it('should work with Observable return type', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'admin' }
          })
        })
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      if (result instanceof Observable) {
        result.subscribe(val => expect(val).toBe(true));
      } else {
        expect(result).toBe(true);
      }
    });
  });
});