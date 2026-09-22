import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * SuperAdminGuard verifies that the authenticated user has SUPER_ADMIN system role.
 * This guard should be used for system-wide administrative endpoints that transcend
 * workspace-level permissions.
 * 
 * Usage:
 * @UseGuards(SuperAdminGuard)
 * @Controller('admin')
 * export class AdminController { }
 * 
 * Or on individual routes:
 * @UseGuards(SuperAdminGuard)
 * @Get('users')
 * getAllUsers() { }
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    const user = request.user;

    // Must be authenticated
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Must have SUPER_ADMIN system role
    if (user.systemRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied. Super Administrator privileges required.',
      );
    }

    return true;
  }
}
