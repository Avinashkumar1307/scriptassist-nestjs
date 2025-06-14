import { ERROR_MESSAGES } from './error.constants';

describe('ERROR_MESSAGES', () => {
  describe('AUTH messages', () => {
    it('should have all auth error messages defined', () => {
      expect(ERROR_MESSAGES.AUTH).toEqual({
        EMAIL_PASSWORD_REQUIRED: expect.any(String),
        INVALID_CREDENTIALS: expect.any(String),
        ACCOUNT_INACTIVE: expect.any(String),
        EMAIL_EXISTS: expect.any(String),
        REGISTRATION_FAILED: expect.any(String),
        WEAK_PASSWORD: expect.any(String),
        USER_NOT_FOUND: expect.any(String),
        INSUFFICIENT_PERMISSIONS: expect.any(String),
        TOKEN_GENERATION_FAILED: expect.any(String),
        VALIDATION_FAILED: expect.any(String),
        ROLE_VALIDATION_FAILED: expect.any(String),
        LOGIN_FAILED: expect.any(String),
      });
    });

    it('should have specific auth message content', () => {
      expect(ERROR_MESSAGES.AUTH.WEAK_PASSWORD).toBe(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      );
    });
  });

  describe('TASKS messages', () => {
    it('should have all task error messages defined', () => {
      expect(ERROR_MESSAGES.TASKS).toEqual({
        NOT_FOUND: expect.any(Function),
        CREATE_FAILED: expect.any(String),
        FETCH_FAILED: expect.any(String),
        UPDATE_FAILED: expect.any(String),
        DELETE_FAILED: expect.any(String),
        QUEUE_ERROR: expect.any(String),
        CONFLICT: expect.any(String),
        INVALID_PAGINATION: expect.any(String),
        STATS_FAILED: expect.any(String),
        INVALID_BATCH_INPUT: expect.any(String),
        EMPTY_BATCH: expect.any(String),
        INVALID_ACTION: expect.any(Function),
        BATCH_FAILED: expect.any(String),
      });
    });

    it('should format NOT_FOUND message with task ID', () => {
      const taskId = '123e4567-e89b-12d3-a456-426614174000';
      expect(ERROR_MESSAGES.TASKS.NOT_FOUND(taskId)).toBe(
        `Task with ID ${taskId} not found`
      );
    });

    it('should format INVALID_ACTION message with action', () => {
      const action = 'invalid_action';
      expect(ERROR_MESSAGES.TASKS.INVALID_ACTION(action)).toBe(
        `Invalid batch action: ${action}`
      );
    });
  });

  describe('USER messages', () => {
    it('should have all user error messages defined', () => {
      expect(ERROR_MESSAGES.USER).toEqual({
        NOT_FOUND: expect.any(Function),
        EMAIL_EXISTS: expect.any(String),
        CREATE_FAILED: expect.any(String),
        FETCH_ALL_FAILED: expect.any(String),
        FETCH_FAILED: expect.any(String),
        UPDATE_FAILED: expect.any(String),
        DELETE_FAILED: expect.any(String),
        EMAIL_REQUIRED: expect.any(String),
      });
    });

    it('should format NOT_FOUND message with user ID', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      expect(ERROR_MESSAGES.USER.NOT_FOUND(userId)).toBe(
        `User with ID ${userId} not found`
      );
    });

    it('should have consistent email exists message', () => {
      expect(ERROR_MESSAGES.USER.EMAIL_EXISTS).toBe('Email already in use');
      expect(ERROR_MESSAGES.AUTH.EMAIL_EXISTS).toBe('Email already registered');
    });
  });

  describe('Message consistency', () => {
    it('should have non-empty strings for all messages', () => {
      const checkMessages = (messages: any) => {
        for (const [key, value] of Object.entries(messages)) {
          if (typeof value === 'function') {
            // Test the function with a sample input
            const result = value('test-id');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
          } else {
            expect(value).toBeTruthy();
            expect(typeof value).toBe('string');
          }
        }
      };

      checkMessages(ERROR_MESSAGES.AUTH);
      checkMessages(ERROR_MESSAGES.TASKS);
      checkMessages(ERROR_MESSAGES.USER);
    });

    it('should have consistent message types', () => {
      expect(typeof ERROR_MESSAGES.TASKS.NOT_FOUND).toBe('function');
      expect(typeof ERROR_MESSAGES.TASKS.CREATE_FAILED).toBe('string');
      expect(typeof ERROR_MESSAGES.USER.NOT_FOUND).toBe('function');
      expect(typeof ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS).toBe('string');
    });
  });
});