import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps controller responses in a standard envelope.
 * Controllers that return paginated results (with `data` and `pagination` keys)
 * are passed through as-is. All other responses are wrapped in { data: ... }.
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: unknown) => {
        // Null / undefined → return as-is (204 No Content)
        if (response == null) return response;

        // Already paginated or structured
        if (typeof response === 'object' && response !== null) {
          const r = response as Record<string, unknown>;
          if ('data' in r && 'pagination' in r) return r;
          if ('data' in r && Array.isArray(r.data)) return r;
        }

        return response;
      }),
    );
  }
}
