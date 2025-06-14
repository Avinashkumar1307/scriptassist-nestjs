import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockResponse: jest.Mocked<Response>;
  let mockRequest: jest.Mocked<Request>;
  let mockHost: jest.Mocked<ArgumentsHost>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as jest.Mocked<ConfigService>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as jest.Mocked<Response>;

    mockRequest = {
      url: '/test',
      method: 'GET',
    } as unknown as jest.Mocked<Request>;

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;

    filter = new HttpExceptionFilter(mockConfigService);
    (filter as any).logger = mockLogger; // Replace the actual logger with our mock
  });

  describe('catch', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        path: '/test',
        timestamp: expect.any(String),
        details: 'Test error',
        stack: expect.any(String),
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Test error', errors: ['error1'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        path: '/test',
        timestamp: expect.any(String),
        errors: ['error1'],
        details: expect.any(String),
        stack: expect.any(String),
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path: '/test',
        timestamp: expect.any(String),
        details: 'Test error',
        stack: expect.any(String),
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should hide sensitive info in production', () => {
      mockConfigService.get.mockReturnValue('production');
      const exception = new Error('Test error');

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path: '/test',
        timestamp: expect.any(String),
      });
    });

    it('should log errors appropriately by status code', () => {
      // Test 5xx error
      const serverError = new Error('Server error');
      filter.catch(serverError, mockHost);
      expect(mockLogger.error).toHaveBeenCalled();

      // Test 4xx error
      const clientError = new HttpException('Client error', HttpStatus.BAD_REQUEST);
      filter.catch(clientError, mockHost);
      expect(mockLogger.warn).toHaveBeenCalled();

      // Test non-error status
      const redirect = new HttpException('Redirect', HttpStatus.MOVED_PERMANENTLY);
      filter.catch(redirect, mockHost);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should handle unknown error types', () => {
      const exception = 'Just a string error';

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path: '/test',
        timestamp: expect.any(String),
      });
    });
  });
});