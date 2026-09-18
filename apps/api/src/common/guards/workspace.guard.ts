import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser; workspaceId: string; workspaceRole: string }>();

    const user = request.user;
    if (!user) return false;

    const workspaceId =
      (request.headers['x-workspace-id'] as string) ??
      (request.params['workspaceId'] as string) ??
      (request.params['id'] as string);

    if (!workspaceId) {
      throw new BadRequestException('X-Workspace-ID header is required');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      select: { isActive: true, role: true },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach workspace context to request
    request.workspaceId = workspaceId;
    request.workspaceRole = member.role;
    user.workspaceId = workspaceId;
    user.role = member.role;

    return true;
  }
}
