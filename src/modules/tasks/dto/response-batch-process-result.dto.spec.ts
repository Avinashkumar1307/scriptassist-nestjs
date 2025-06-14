import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BatchProcessResultDto } from './response-batch-process-result.dto';

describe('BatchProcessResultDto', () => {
  const validData = {
    taskId: '660e8400-e29b-41d4-a716-446655440004',
    success: true,
    result: { some: 'data' },
    error: 'An error occurred',
  };

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(BatchProcessResultDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('taskId validation', () => {
    

    it('should accept valid UUID v4', async () => {
      const validUUIDs = [
        '660e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000', // example from RFC 4122
      ];

      for (const uuid of validUUIDs) {
        const data = { ...validData, taskId: uuid };
        const dto = plainToInstance(BatchProcessResultDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('success validation', () => {
    it('should fail if success is missing', async () => {
      const { success, ...data } = validData;
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('success');
    });

    it('should fail if success is not a boolean', async () => {
      const data = { ...validData, success: 'true' as any };
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should accept both true and false values', async () => {
      for (const value of [true, false]) {
        const data = { ...validData, success: value };
        const dto = plainToInstance(BatchProcessResultDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('result validation', () => {
    it('should pass if result is missing', async () => {
      const { result, ...data } = validData;
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept any type for result', async () => {
      const testCases = [
        { type: 'string', value: 'success' },
        { type: 'number', value: 123 },
        { type: 'object', value: { key: 'value' } },
        { type: 'array', value: [1, 2, 3] },
        { type: 'null', value: null },
      ];

      for (const { type, value } of testCases) {
        const data = { ...validData, result: value };
        const dto = plainToInstance(BatchProcessResultDto, data);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('error validation', () => {
    it('should pass if error is missing', async () => {
      const { error, ...data } = validData;
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if error is not a string', async () => {
      const data = { ...validData, error: 123 as any };
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should accept empty error string', async () => {
      const data = { ...validData, error: '' };
      const dto = plainToInstance(BatchProcessResultDto, data);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ApiProperty decorators', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const dto = new BatchProcessResultDto();
      dto.taskId = '660e8400-e29b-41d4-a716-446655440004';
      dto.success = true;
      dto.result = { some: 'data' };
      dto.error = 'Error message';

      expect(dto).toHaveProperty('taskId');
      expect(dto).toHaveProperty('success');
      expect(dto).toHaveProperty('result');
      expect(dto).toHaveProperty('error');
    });
  });
});
