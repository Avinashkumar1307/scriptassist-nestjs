import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, headers, ip } = request;
    const user = request.user as { userId?: string } | undefined;
    const now = Date.now();

    // Sanitize headers to avoid logging sensitive information
    const safeHeaders = { ...headers };
    delete safeHeaders['authorization'];
    delete safeHeaders['cookie'];

    // Log incoming request
    const requestLog = {
      method,
      url,
      ip,
      userId: user?.userId || 'anonymous',
      headers: safeHeaders,
      body: this.sanitizeBody(request.body),
      timestamp: new Date().toISOString(),
    };
    this.logger.log(`Incoming Request: ${JSON.stringify(requestLog)}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          const responseLog = {
            method,
            url,
            statusCode: response.statusCode,
            responseTime: `${responseTime}ms`,
            userId: user?.userId || 'anonymous',
            response: this.isProduction() ? 'hidden in production' : this.sanitizeBody(data),
            timestamp: new Date().toISOString(),
          };
          this.logger.log(`Outgoing Response: ${JSON.stringify(responseLog)}`);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          const errorLog = {
            method,
            url,
            statusCode: error instanceof HttpException ? error.getStatus() : 500,
            responseTime: `${responseTime}ms`,
            userId: user?.userId || 'anonymous',
            error: error.message,
            timestamp: new Date().toISOString(),
          };
          this.logger.error(`Error Response: ${JSON.stringify(errorLog)}`, error.stack);
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const safeBody = JSON.parse(JSON.stringify(body)); // Deep copy to avoid mutating
    const sensitiveFields = ['password', 'access_token', 'refresh_token', 'secret'];

    // Recursively sanitize sensitive fields
    const sanitize = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const key of Object.keys(obj)) {
        if (sensitiveFields.includes(key.toLowerCase())) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(safeBody);
    return safeBody;
  }

  private isProduction(): boolean {
    return this.configService.get<string>('app.environment') === 'production';
  }
}