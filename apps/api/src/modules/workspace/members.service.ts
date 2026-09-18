import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';
import type { WorkspaceMemberRole } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    workspaceId: string,
    opts: { role?: WorkspaceMemberRole; search?: string; limit?: number; cursor?: string },
  ) {
    const limit = opts.limit ?? 25;
    const cursorId = cursorToId(opts.cursor);

    const [members, total] = await Promise.all([
      this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          ...(opts.role && { role: opts.role }),
          ...(opts.search && {
            user: {
              OR: [
                { firstName: { contains: opts.search, mode: 'insensitive' } },
                { lastName: { contains: opts.search, mode: 'insensitive' } },
                { email: { contains: opts.search, mode: 'insensitive' } },
              ],
            },
          }),
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);

    return buildPaginatedResult(members, limit, total);
  }

  async update(workspaceId: string, memberId: string, dto: UpdateMemberDto, requestingUserId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Prevent self-role-change for owner
    if (member.userId === requestingUserId && dto.role && member.role === 'OWNER') {
      throw new ForbiddenException('Owner role cannot be changed');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async remove(workspaceId: string, memberId: string, requestingUserId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove the workspace owner');
    if (member.userId === requestingUserId) throw new ForbiddenException('Cannot remove yourself');

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
  }
}
