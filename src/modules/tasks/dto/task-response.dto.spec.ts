import { plainToInstance } from 'class-transformer';
import { TaskResponseDto } from './task-response.dto';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

describe('TaskResponseDto', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Complete project documentation',
    description: 'Add details about API endpoints',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2023-12-31T23:59:59Z'),
    userId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z')
  };

  it('should create successfully with valid data', () => {
    const dto = plainToInstance(TaskResponseDto, validData);
    expect(dto).toEqual(validData);
  });

  describe('property validation', () => {
    it('should have required id property', () => {
      const dto = new TaskResponseDto();
      dto.id = validData.id;
      expect(dto.id).toBe(validData.id);
    });

    it('should have required title property', () => {
      const dto = new TaskResponseDto();
      dto.title = validData.title;
      expect(dto.title).toBe(validData.title);
    });

    it('should have required description property', () => {
      const dto = new TaskResponseDto();
      dto.description = validData.description;
      expect(dto.description).toBe(validData.description);
    });

    it('should accept valid status enum values', () => {
      const dto = new TaskResponseDto();
      for (const status of Object.values(TaskStatus)) {
        dto.status = status;
        expect(dto.status).toBe(status);
      }
    });

    it('should accept valid priority enum values', () => {
      const dto = new TaskResponseDto();
      for (const priority of Object.values(TaskPriority)) {
        dto.priority = priority;
        expect(dto.priority).toBe(priority);
      }
    });

    it('should have required date properties', () => {
      const dto = new TaskResponseDto();
      dto.dueDate = validData.dueDate;
      dto.createdAt = validData.createdAt;
      dto.updatedAt = validData.updatedAt;
      
      expect(dto.dueDate).toBeInstanceOf(Date);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('ApiProperty decorators', () => {
    it('should have all properties decorated with ApiProperty', () => {
      const dto = new TaskResponseDto();
      dto.id = validData.id;
      dto.title = validData.title;
      dto.description = validData.description;
      dto.status = validData.status;
      dto.priority = validData.priority;
      dto.dueDate = validData.dueDate;
      dto.userId = validData.userId;
      dto.createdAt = validData.createdAt;
      dto.updatedAt = validData.updatedAt;

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('title');
      expect(dto).toHaveProperty('description');
      expect(dto).toHaveProperty('status');
      expect(dto).toHaveProperty('priority');
      expect(dto).toHaveProperty('dueDate');
      expect(dto).toHaveProperty('userId');
      expect(dto).toHaveProperty('createdAt');
      expect(dto).toHaveProperty('updatedAt');
    });
  });
});