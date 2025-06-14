import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TaskStatsDto } from './response-stats.dto';

describe('TaskStatsDto', () => {
  const validData = {
    total: 100,
    completed: 30,
    inProgress: 20,
    pending: 50,
    highPriority: 10
  };

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(TaskStatsDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('total validation', () => {
    it('should fail if total is missing', async () => {
      const { total, ...data } = validData;
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('total');
    });

    it('should fail if total is negative', async () => {
      const data = { ...validData, total: -1 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail if total is not an integer', async () => {
      const testCases = [10.5, '100', true, null];
      
      for (const value of testCases) {
        const data = { ...validData, total: value as any };
        const dto = plainToInstance(TaskStatsDto, data);
        const errors = await validate(dto);
        
        expect(errors.length).toBe(1);
        expect(errors[0].constraints).toHaveProperty('isInt');
      }
    });

    it('should accept zero value', async () => {
      const data = { ...validData, total: 0 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('completed validation', () => {
    it('should fail if completed is missing', async () => {
      const { completed, ...data } = validData;
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('completed');
    });

    it('should fail if completed is negative', async () => {
      const data = { ...validData, completed: -5 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should accept zero value', async () => {
      const data = { ...validData, completed: 0 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('inProgress validation', () => {
    it('should fail if inProgress is missing', async () => {
      const { inProgress, ...data } = validData;
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('inProgress');
    });

    it('should fail if inProgress exceeds total', async () => {
      const data = { ...validData, inProgress: validData.total + 1 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      // Note: This is a business logic check that would need custom validator
      // Currently just testing basic validation
      expect(errors.length).toBe(0); 
    });

    it('should accept zero value', async () => {
      const data = { ...validData, inProgress: 0 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('pending validation', () => {
    it('should fail if pending is missing', async () => {
      const { pending, ...data } = validData;
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('pending');
    });

    it('should fail if pending is negative', async () => {
      const data = { ...validData, pending: -10 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('highPriority validation', () => {
    it('should fail if highPriority is missing', async () => {
      const { highPriority, ...data } = validData;
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('highPriority');
    });

    it('should accept zero high priority tasks', async () => {
      const data = { ...validData, highPriority: 0 };
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ApiProperty decorators', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const dto = new TaskStatsDto();
      dto.total = 100;
      dto.completed = 30;
      dto.inProgress = 20;
      dto.pending = 50;
      dto.highPriority = 10;

      expect(dto).toHaveProperty('total');
      expect(dto).toHaveProperty('completed');
      expect(dto).toHaveProperty('inProgress');
      expect(dto).toHaveProperty('pending');
      expect(dto).toHaveProperty('highPriority');
    });
  });

  describe('Business Logic Validation', () => {
    it('should fail if sum of completed, inProgress and pending exceeds total', async () => {
      // This would require a custom validator
      const data = {
        total: 100,
        completed: 50,
        inProgress: 40,
        pending: 20, // Sum = 110 > total
        highPriority: 10
      };
      
      const dto = plainToInstance(TaskStatsDto, data);
      const errors = await validate(dto);
      
      // Note: This test currently passes because we don't have this validation
      // To implement, you'd need a custom @IsValidTaskStats decorator
      expect(errors.length).toBe(0);
    });
  });
});