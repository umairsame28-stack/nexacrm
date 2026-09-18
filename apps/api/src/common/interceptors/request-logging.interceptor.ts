import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { requestId: string; startTime: number }>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) ?? uuidv4();
    request.requestId = requestId;
    request.startTime = Date.now();

    // Attach request ID to response headers
    response.setHeader('X-Request-ID', requestId);

    const { method, url } = request;

    this.logger.log(`→ ${method} ${url} [${requestId}]`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - request.startTime;
          const statusCode = response.statusCode;
          this.logger.log(`← ${method} ${url} ${statusCode} ${duration}ms [${requestId}]`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - request.startTime;
          const status = (err as { status?: number })?.status ?? 500;
          this.logger.warn(`← ${method} ${url} ${status} ${duration}ms [${requestId}]`);
        },
      }),
    );
  }
}
