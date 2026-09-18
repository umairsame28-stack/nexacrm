import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Extracts the workspace ID from the request object (set by WorkspaceGuard).
 * Usage: @WorkspaceId() workspaceId: string
 */
export const WorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { workspaceId: string }>();
    return request.workspaceId;
  },
);
