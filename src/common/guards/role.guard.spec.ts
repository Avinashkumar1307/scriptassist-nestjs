import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      (mockContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'admin' },
        }),
      });

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      (mockContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'user' },
        }),
      });

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should check both handler and class level decorators', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);
      (mockContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'moderator' },
        }),
      });

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should handle missing user role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      (mockContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {},
        }),
      });

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should work with multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'superadmin']);
      (mockContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'superadmin' },
        }),
      });

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});
