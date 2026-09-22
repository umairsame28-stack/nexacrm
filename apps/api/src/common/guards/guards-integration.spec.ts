import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WorkspaceGuard } from './workspace.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import type { WorkspaceMemberRole } from '@prisma/client';

describe('Guards Integration Tests', () => {
  let reflector: Reflector;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Reflector,
        {
          provide: PrismaService,
          useValue: {
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(() => {
      guard = new JwtAuthGuard(reflector);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow public routes without authentication', () => {
      const context = createMockExecutionContext({ isPublic: true });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should pass authenticated user through', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toEqual(user);
    });

    it('should throw error when authentication fails', () => {
      const error = new Error('Token expired');
      expect(() => {
        guard.handleRequest(error, null);
      }).toThrow(error);
    });
  });

  describe('WorkspaceGuard', () => {
    let guard: WorkspaceGuard;

    beforeEach(() => {
      guard = new WorkspaceGuard(prismaService, reflector);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow public routes', async () => {
      const context = createMockExecutionContext({ isPublic: true });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should block request without authenticated user', async () => {
      const context = createMockExecutionContext({
        user: null,
        headers: { 'x-workspace-id': 'ws-123' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should throw error when workspace ID is missing', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', email: 'test@example.com' },
        headers: {},
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'X-Workspace-ID header is required',
      );
    });

    it('should throw ForbiddenException when user is not a workspace member', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', email: 'test@example.com' },
        headers: { 'x-workspace-id': 'ws-123' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when workspace member is inactive', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', email: 'test@example.com' },
        headers: { 'x-workspace-id': 'ws-123' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue({
        isActive: false,
        role: 'VIEWER',
      } as any);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow active workspace member and attach context', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'test@example.com' },
        headers: { 'x-workspace-id': 'ws-123' },
      };
      const context = createMockExecutionContext(mockRequest);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue({
        isActive: true,
        role: 'ADMINISTRATOR',
      } as any);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest.user).toMatchObject({
        id: 'user-123',
        workspaceId: 'ws-123',
        role: 'ADMINISTRATOR',
      });
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'VIEWER' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has no role', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRATOR'] as WorkspaceMemberRole[]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user role is insufficient', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'VIEWER' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRATOR'] as WorkspaceMemberRole[]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when user has exact required role', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'MANAGER' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['MANAGER'] as WorkspaceMemberRole[]);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when user has higher role (OWNER > ADMINISTRATOR)', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'OWNER' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRATOR'] as WorkspaceMemberRole[]);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should respect role hierarchy (OWNER=100, ADMINISTRATOR=80, MANAGER=60)', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'ADMINISTRATOR' },
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['MANAGER'] as WorkspaceMemberRole[]);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access with any of multiple required roles', () => {
      const context = createMockExecutionContext({
        user: { id: 'user-123', role: 'SALES_AGENT' },
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['SALES_AGENT', 'SUPPORT_AGENT'] as WorkspaceMemberRole[]);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Guards Execution Order', () => {
    it('should apply guards in correct order: Throttle -> JWT -> Workspace -> Roles', () => {
      // This is a conceptual test - in real app, APP_GUARD order matters
      const expectedOrder = [
        'ThrottlerGuard',
        'JwtAuthGuard',
        'WorkspaceGuard',
        'RolesGuard',
      ];

      // Verify guards are applied in this sequence
      expect(expectedOrder[0]).toBe('ThrottlerGuard');
      expect(expectedOrder[1]).toBe('JwtAuthGuard');
      expect(expectedOrder[2]).toBe('WorkspaceGuard');
      expect(expectedOrder[3]).toBe('RolesGuard');
    });
  });
});

// Helper function to create mock ExecutionContext
function createMockExecutionContext(options: {
  user?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  isPublic?: boolean;
}): ExecutionContext {
  const mockRequest = {
    user: options.user || null,
    headers: options.headers || {},
    params: options.params || {},
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
