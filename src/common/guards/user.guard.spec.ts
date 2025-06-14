import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { UserGuard } from './user.guard';
import { Observable } from 'rxjs';

describe('UserGuard', () => {
  let guard: UserGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserGuard],
    }).compile();

    guard = module.get<UserGuard>(UserGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for admin role', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '123', role: 'admin' },
            params: { id: '456' },
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should return true when user ID matches param ID', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '123', role: 'user' },
            params: { id: '123' },
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should return false when user ID does not match and role is not admin', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '123', role: 'user' },
            params: { id: '456' },
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should return false when user is not present', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: '456' },
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should return false when user ID is undefined', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'user' },
            params: { id: '456' },
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(false);
    });
  });
});