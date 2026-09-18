import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { WorkspaceMemberRole } from '@prisma/client';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

const ROLE_HIERARCHY: Record<WorkspaceMemberRole, number> = {
  OWNER: 100,
  ADMINISTRATOR: 80,
  MANAGER: 60,
  SALES_AGENT: 40,
  SUPPORT_AGENT: 35,
  VIEWER: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceMemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const userRole = request.user?.role as WorkspaceMemberRole | undefined;

    if (!userRole) {
      throw new ForbiddenException('No role assigned in this workspace');
    }

    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const hasAccess = requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
      return userLevel >= requiredLevel;
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
