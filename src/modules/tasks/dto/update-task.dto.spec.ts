import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTaskDto } from './update-task.dto';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

describe('UpdateTaskDto', () => {
  const validData = {
    title: 'Updated task title',
    description: 'Updated description',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2023-12-31T23:59:59Z'),
  };

  it('should allow partial updates', async () => {
    const partialData = { title: 'Just update title' };
    const dto = plainToInstance(UpdateTaskDto, partialData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate status enum when provided', async () => {
    const dto = plainToInstance(UpdateTaskDto, { status: 'INVALID_STATUS' as any });
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should validate priority enum when provided', async () => {
    const dto = plainToInstance(UpdateTaskDto, { priority: 'INVALID_PRIORITY' as any });
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should accept valid partial updates', async () => {
    const testCases = [
      { title: 'New title' },
      { status: TaskStatus.COMPLETED },
      { priority: TaskPriority.LOW },
      { dueDate: new Date() },
      { description: 'New description' },
    ];

    for (const data of testCases) {
      const dto = plainToInstance(UpdateTaskDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});
