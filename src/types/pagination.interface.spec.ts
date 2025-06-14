import { PaginationOptions, PaginatedResponse } from './pagination.interface';

// Concrete implementations for testing
class TestPaginationOptions implements PaginationOptions {
  constructor(
    public page?: number,
    public limit?: number,
    public sortBy?: string,
    public sortOrder?: 'ASC' | 'DESC',
  ) {}
}

class TestPaginatedResponse<T> implements PaginatedResponse<T> {
  constructor(
    public data: T[],
    public meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
  ) {
    // Runtime validation
    if (
      typeof meta.total !== 'number' ||
      typeof meta.page !== 'number' ||
      typeof meta.limit !== 'number' ||
      typeof meta.totalPages !== 'number'
    ) {
      throw new Error(
        'All meta fields (total, page, limit, totalPages) are required and must be numbers',
      );
    }
  }
}

describe('Pagination Interfaces', () => {
  describe('PaginationOptions', () => {
    it('should allow empty options', () => {
      const options = new TestPaginationOptions();
      expect(options.page).toBeUndefined();
      expect(options.limit).toBeUndefined();
      expect(options.sortBy).toBeUndefined();
      expect(options.sortOrder).toBeUndefined();
    });

    it('should accept all valid options', () => {
      const options = new TestPaginationOptions(1, 10, 'createdAt', 'DESC');
      expect(options.page).toBe(1);
      expect(options.limit).toBe(10);
      expect(options.sortBy).toBe('createdAt');
      expect(options.sortOrder).toBe('DESC');
    });

    it('should enforce number types for page and limit', () => {
      // @ts-expect-error - Testing invalid type
      const invalidPage = new TestPaginationOptions('1', 10);
      // @ts-expect-error - Testing invalid type
      const invalidLimit = new TestPaginationOptions(1, '10');

      expect(typeof invalidPage.page).not.toBe('number');
      expect(typeof invalidLimit.limit).not.toBe('number');
    });

    it('should enforce sortOrder as ASC or DESC', () => {
      // @ts-expect-error - Testing invalid type
      const invalidSortOrder = new TestPaginationOptions(1, 10, 'name', 'INVALID');
      expect(['ASC', 'DESC']).not.toContain(invalidSortOrder.sortOrder);
    });

    it('should allow partial options', () => {
      const pageOnly = new TestPaginationOptions(1);
      const sortOnly = new TestPaginationOptions(undefined, undefined, 'name');

      expect(pageOnly.page).toBe(1);
      expect(pageOnly.limit).toBeUndefined();
      expect(sortOnly.sortBy).toBe('name');
      expect(sortOnly.sortOrder).toBeUndefined();
    });
  });

  describe('PaginatedResponse', () => {
    const sampleData = [{ id: 1 }, { id: 2 }];
    const completeMeta = {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    };

    it('should require all meta fields', () => {
      // Test missing fields throw errors
      expect(() => {
        // @ts-expect-error
        new TestPaginatedResponse(sampleData, {
          page: 1,
          limit: 10,
          totalPages: 10,
        });
      }).toThrow();

      expect(() => {
        // @ts-expect-error
        new TestPaginatedResponse(sampleData, {
          total: 100,
          limit: 10,
          totalPages: 10,
        });
      }).toThrow();

      expect(() => {
        // @ts-expect-error
        new TestPaginatedResponse(sampleData, {
          total: 100,
          page: 1,
          totalPages: 10,
        });
      }).toThrow();

      expect(() => {
        // @ts-expect-error
        new TestPaginatedResponse(sampleData, {
          total: 100,
          page: 1,
          limit: 10,
        });
      }).toThrow();

      // Test valid complete meta
      const validResponse = new TestPaginatedResponse(sampleData, completeMeta);
      expect(validResponse.meta).toEqual(completeMeta);
    });

  

    it('should accept any array type for data', () => {
      const stringData = new TestPaginatedResponse(['a', 'b'], completeMeta);
      const numberData = new TestPaginatedResponse([1, 2], completeMeta);
      const mixedData = new TestPaginatedResponse([1, 'a', true], completeMeta);

      expect(stringData.data).toEqual(['a', 'b']);
      expect(numberData.data).toEqual([1, 2]);
      expect(mixedData.data).toEqual([1, 'a', true]);
    });

    it('should calculate totalPages correctly', () => {
      const response = new TestPaginatedResponse(sampleData, {
        total: 95,
        page: 1,
        limit: 10,
        totalPages: 10,
      });

      expect(response.meta.totalPages).toBe(10);
    });

    it('should handle edge cases in meta data', () => {
      const emptyData = new TestPaginatedResponse([], {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const singlePage = new TestPaginatedResponse(sampleData, {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(emptyData.meta.totalPages).toBe(0);
      expect(singlePage.meta.totalPages).toBe(1);
    });
  });

  describe('Integration Between Interfaces', () => {
    it('should work together in a paginated flow', () => {
      const options = new TestPaginationOptions(2, 5, 'name', 'ASC');
      const response = new TestPaginatedResponse(
        [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        {
          total: 20,
          page: options.page || 1,
          limit: options.limit || 10,
          totalPages: Math.ceil(20 / (options.limit || 10)),
        },
      );

      expect(response.meta.page).toBe(2);
      expect(response.meta.limit).toBe(5);
      expect(response.meta.totalPages).toBe(4);
    });
  });
});
