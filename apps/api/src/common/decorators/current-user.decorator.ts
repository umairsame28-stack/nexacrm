import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * User shape before the WorkspaceGuard runs (auth endpoints).
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Populated by WorkspaceGuard from X-Workspace-ID header */
  workspaceId: string;
  /** Populated by WorkspaceGuard with the member role */
  role: string;
}

/**
 * Extracts the authenticated user from the request object.
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;
    if (data) {
      return user?.[data] as unknown as AuthenticatedUser;
    }
    return user;
  },
);
