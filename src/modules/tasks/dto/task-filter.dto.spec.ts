import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TaskFilterDto } from './task-filter.dto';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

describe('TaskFilterDto', () => {
  const validData = {
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    search: 'urgent task',
    createdAfter: '2025-01-01T00:00:00Z',
    createdBefore: '2025-12-31T23:59:59Z',
    dueAfter: '2025-01-01T00:00:00Z',
    dueBefore: '2025-12-31T23:59:59Z',
    page: 1,
    limit: 10
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(TaskFilterDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with empty object', async () => {
    const dto = plainToInstance(TaskFilterDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('status validation', () => {
    it('should reject invalid status', async () => {
      const dto = plainToInstance(TaskFilterDto, { status: 'INVALID' });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('priority validation', () => {
    it('should reject invalid priority', async () => {
      const dto = plainToInstance(TaskFilterDto, { priority: 'INVALID' });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('userId validation', () => {
    it('should reject non-string userId', async () => {
      const dto = plainToInstance(TaskFilterDto, { userId: 123 as any });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('search validation', () => {
    it('should reject non-string search', async () => {
      const dto = plainToInstance(TaskFilterDto, { search: 123 as any });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('date validation', () => {
    it('should reject invalid createdAfter', async () => {
      const dto = plainToInstance(TaskFilterDto, { createdAfter: 'invalid' });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('should reject invalid dueBefore', async () => {
      const dto = plainToInstance(TaskFilterDto, { dueBefore: 'invalid' });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });
  });

  describe('pagination validation', () => {
    it('should reject page < 1', async () => {
      const dto = plainToInstance(TaskFilterDto, { page: 0 });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject limit < 1', async () => {
      const dto = plainToInstance(TaskFilterDto, { limit: 0 });
      const errors = await validate(dto);
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });
});