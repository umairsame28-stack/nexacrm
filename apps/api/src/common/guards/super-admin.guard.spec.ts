import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SuperAdminGuard } from './super-admin.guard';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SuperAdminGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for routes marked as @Public()', () => {
    const context = createMockExecutionContext({
      user: null,
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    const context = createMockExecutionContext({
      user: null,
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Authentication required');
  });

  it('should throw ForbiddenException when user is not a SUPER_ADMIN', () => {
    const context = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        systemRole: 'USER',
        workspaceId: 'ws-123',
        role: 'OWNER',
      },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Access denied. Super Administrator privileges required.',
    );
  });

  it('should allow access when user is SUPER_ADMIN', () => {
    const context = createMockExecutionContext({
      user: {
        id: 'admin-123',
        email: 'admin@nexacrm.com',
        firstName: 'Admin',
        lastName: 'User',
        systemRole: 'SUPER_ADMIN',
        workspaceId: '',
        role: '',
      },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow SUPER_ADMIN even when systemRole is undefined but system recognizes them', () => {
    // Edge case: ensure explicit check for 'SUPER_ADMIN' string
    const context = createMockExecutionContext({
      user: {
        id: 'admin-123',
        email: 'admin@nexacrm.com',
        firstName: 'Admin',
        lastName: 'User',
        systemRole: 'SUPER_ADMIN',
        workspaceId: '',
        role: '',
      },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when systemRole is undefined (defaults to USER)', () => {
    const context = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        systemRole: undefined,
        workspaceId: 'ws-123',
        role: 'OWNER',
      },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should work independently of workspace role (OWNER vs VIEWER)', () => {
    // A SUPER_ADMIN can have any workspace role or none
    const contextWithOwner = createMockExecutionContext({
      user: {
        id: 'admin-123',
        email: 'admin@nexacrm.com',
        firstName: 'Admin',
        lastName: 'User',
        systemRole: 'SUPER_ADMIN',
        workspaceId: 'ws-123',
        role: 'VIEWER', // Low workspace role, but still super admin
      },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(contextWithOwner)).toBe(true);
  });
});

// Helper function to create mock ExecutionContext
function createMockExecutionContext(options: { user?: any }): ExecutionContext {
  const mockRequest = {
    user: options.user || null,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
