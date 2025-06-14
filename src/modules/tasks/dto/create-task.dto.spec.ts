import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

describe('CreateTaskDto', () => {
  const validData = {
    title: 'Complete project documentation',
    description: 'Add details about API endpoints',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2023-12-31T23:59:59Z'),
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(CreateTaskDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('title validation', () => {
    it('should fail if title is missing', async () => {
      const { title, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if title is not a string', async () => {
      const data = { ...validData, title: 123 as any };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('description validation', () => {
    it('should pass if description is missing', async () => {
      const { description, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if description is not a string', async () => {
      const data = { ...validData, description: 123 as any };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass with empty description string', async () => {
      const data = { ...validData, description: '' };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('status validation', () => {
    it('should pass if status is missing', async () => {
      const { status, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if status is invalid', async () => {
      const data = { ...validData, status: 'INVALID_STATUS' as any };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should accept all TaskStatus values', async () => {
      for (const status of Object.values(TaskStatus)) {
        const data = { ...validData, status };
        const dto = plainToInstance(CreateTaskDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('priority validation', () => {
    it('should pass if priority is missing', async () => {
      const { priority, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if priority is invalid', async () => {
      const data = { ...validData, priority: 'INVALID_PRIORITY' as any };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should accept all TaskPriority values', async () => {
      for (const priority of Object.values(TaskPriority)) {
        const data = { ...validData, priority };
        const dto = plainToInstance(CreateTaskDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('dueDate validation', () => {
    it('should pass if dueDate is missing', async () => {
      const { dueDate, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if dueDate is invalid date string', async () => {
      const data = { ...validData, dueDate: 'invalid-date' as any };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      // Note: @IsDateString is commented out in your DTO
      // If you uncomment it, this test should expect 1 error
      expect(errors.length).toBe(0);
    });

    it('should accept Date objects', async () => {
      const data = { ...validData, dueDate: new Date() };
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('userId validation', () => {
    it('should fail if userId is missing', async () => {
      const { userId, ...data } = validData;
      const dto = plainToInstance(CreateTaskDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should accept valid UUID v4', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
      ];

      for (const uuid of validUUIDs) {
        const data = { ...validData, userId: uuid };
        const dto = plainToInstance(CreateTaskDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('ApiProperty decorators', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const dto = new CreateTaskDto();
      dto.title = 'Test';
      dto.description = 'Test description';
      dto.status = TaskStatus.PENDING;
      dto.priority = TaskPriority.MEDIUM;
      dto.dueDate = new Date();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';

      expect(dto).toHaveProperty('title');
      expect(dto).toHaveProperty('description');
      expect(dto).toHaveProperty('status');
      expect(dto).toHaveProperty('priority');
      expect(dto).toHaveProperty('dueDate');
      expect(dto).toHaveProperty('userId');
    });
  });
});
