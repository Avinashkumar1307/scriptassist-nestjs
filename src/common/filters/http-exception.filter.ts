import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Determine status code and message
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = exception instanceof HttpException 
      ? exception.getResponse() 
      : { message: 'Internal server error' };

    // Log based on severity
    const logMessage = `HTTP ${status} - ${request.method} ${request.url}: ${
      typeof message === 'string' ? message : JSON.stringify(message)
    }`;

    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Format error response
    const isProduction = this.configService.get<string>('app.environment') === 'production';
    const errorResponse: {
      success: false;
      statusCode: number;
      message: string;
      path: string;
      timestamp: string;
      details?: string;
      stack?: string;
      errors?: any;
    } = {
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message || 'An error occurred',
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { 
        details: exception instanceof Error ? exception.message : undefined,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Handle specific error cases
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorResponse.message = (exceptionResponse as any).message || errorResponse.message;
        errorResponse['errors'] = (exceptionResponse as any).errors || undefined;
      }
    }

    response.status(status).json(errorResponse);
  }
}