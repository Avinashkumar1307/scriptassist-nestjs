import { HttpResponse } from './http-response.interface';

// Concrete implementation for testing
class TestResponse<T> implements HttpResponse<T> {
  constructor(
    public success: boolean,
    public data?: T,
    public message?: string,
    public error?: string
  ) {}
}

describe('HttpResponse Interface', () => {
  describe('Basic Structure', () => {
    it('should allow success-only responses', () => {
      const response = new TestResponse(true);
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.error).toBeUndefined();
    });

    it('should allow data responses', () => {
      const testData = { id: 1, name: 'Test' };
      const response = new TestResponse(true, testData);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.message).toBeUndefined();
      expect(response.error).toBeUndefined();
    });

    it('should allow message responses', () => {
      const response = new TestResponse(true, undefined, 'Operation successful');
      
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBe('Operation successful');
      expect(response.error).toBeUndefined();
    });

    it('should allow error responses', () => {
      const response = new TestResponse(false, undefined, undefined, 'Not found');
      
      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.error).toBe('Not found');
    });
  });

  describe('Type Safety', () => {
    it('should enforce boolean success field', () => {
      // @ts-expect-error - Testing invalid type
      const invalidResponse = new TestResponse('true');
      expect(typeof invalidResponse.success).not.toBe('boolean');
    });

    it('should allow any type for data field', () => {
      const stringData = new TestResponse(true, 'string data');
      const numberData = new TestResponse(true, 123);
      const objectData = new TestResponse(true, { key: 'value' });
      const arrayData = new TestResponse(true, [1, 2, 3]);
      const nullData = new TestResponse(true, null);
      
      expect(stringData.data).toBe('string data');
      expect(numberData.data).toBe(123);
      expect(objectData.data).toEqual({ key: 'value' });
      expect(arrayData.data).toEqual([1, 2, 3]);
      expect(nullData.data).toBeNull();
    });

    it('should enforce optional message as string', () => {
      // @ts-expect-error - Testing invalid type
      const invalidResponse = new TestResponse(true, undefined, 123);
      expect(typeof invalidResponse.message).not.toBe('string');
    });

    it('should enforce optional error as string', () => {
      // @ts-expect-error - Testing invalid type
      const invalidResponse = new TestResponse(false, undefined, undefined, { code: 404 });
      expect(typeof invalidResponse.error).not.toBe('string');
    });
  });

  describe('Common Use Cases', () => {
    it('should work for success response with data', () => {
      const payload = { items: [] };
      const response = new TestResponse(true, payload, 'Items fetched');
      
      expect(response).toEqual({
        success: true,
        data: { items: [] },
        message: 'Items fetched',
        error: undefined
      });
    });

    it('should work for error response', () => {
      const response = new TestResponse(false, undefined, undefined, 'Unauthorized');
      
      expect(response).toEqual({
        success: false,
        data: undefined,
        message: undefined,
        error: 'Unauthorized'
      });
    });

    it('should work for partial success response', () => {
      const response = new TestResponse(true, undefined, 'Partial results available');
      
      expect(response).toEqual({
        success: true,
        data: undefined,
        message: 'Partial results available',
        error: undefined
      });
    });
  });

  describe('Edge Cases', () => {
    it('should allow empty success response', () => {
      const response = new TestResponse(true);
      expect(response).toEqual({
        success: true,
        data: undefined,
        message: undefined,
        error: undefined
      });
    });

    it('should allow all fields to be populated', () => {
      const response = new TestResponse(
        false,
        { reason: 'conflict' },
        'Could not process',
        'Conflict error'
      );
      
      expect(response).toEqual({
        success: false,
        data: { reason: 'conflict' },
        message: 'Could not process',
        error: 'Conflict error'
      });
    });
  });
});