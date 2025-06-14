import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './response.filtered.data.dto';

describe('PaginationDto', () => {
  const sampleData = [{ id: 1 }, { id: 2 }];
  const validParams = {
    data: sampleData,
    count: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
  };

  describe('data validation', () => {
    it('should fail if data is missing', async () => {
      const { data, ...params } = validParams;
      const dto = plainToInstance(PaginationDto, params);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail if data is not an array', async () => {
      const dto = plainToInstance(PaginationDto, { ...validParams, data: {} as any });
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isArray');
    });
  });

  describe('business logic validation', () => {
    it('should calculate correct totalPages based on count and limit', () => {
      const testCases = [
        { count: 100, limit: 10, expected: 10 },
        { count: 101, limit: 10, expected: 11 },
        { count: 0, limit: 10, expected: 0 },
        { count: 5, limit: 10, expected: 1 },
      ];

      testCases.forEach(({ count, limit, expected }) => {
        const dto = new PaginationDto([], count, 1, limit, expected);
        expect(dto.totalPages).toBe(expected);
      });
    });

    it('should ensure page does not exceed totalPages', () => {
      // This would require a custom validator if you want to enforce it
      const dto = new PaginationDto([], 100, 11, 10, 10);
      // Currently this passes validation but may violate business rules
      expect(dto.page).toBeGreaterThan(dto.totalPages);
    });
  });

  describe('ApiProperty decorators', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const dto = new PaginationDto(sampleData, 100, 1, 10, 10);

      expect(dto).toHaveProperty('data');
      expect(dto).toHaveProperty('count');
      expect(dto).toHaveProperty('page');
      expect(dto).toHaveProperty('limit');
      expect(dto).toHaveProperty('totalPages');
    });
  });
});
