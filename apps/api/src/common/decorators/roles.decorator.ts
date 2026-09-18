import { SetMetadata } from '@nestjs/common';
import type { WorkspaceMemberRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marks a controller or route as requiring specific workspace roles.
 * Usage: @Roles('ADMINISTRATOR', 'MANAGER')
 */
export const Roles = (...roles: WorkspaceMemberRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Marks a route as public (bypasses JWT auth guard).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
