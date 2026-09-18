import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateTeamDto) {
    const existing = await this.prisma.team.findFirst({
      where: { workspaceId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('A team with this name already exists');

    return this.prisma.team.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        departmentId: dto.departmentId,
      },
    });
  }

  async list(workspaceId: string) {
    return this.prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            member: {
              include: { user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } } },
            },
          },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const team = await this.prisma.team.findFirst({ where: { id, workspaceId } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(workspaceId: string, id: string, dto: Partial<CreateTeamDto>) {
    await this.findOne(workspaceId, id);
    return this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.team.delete({ where: { id } });
  }

  async addMember(workspaceId: string, teamId: string, memberId: string) {
    await this.findOne(workspaceId, teamId);
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Workspace member not found');

    return this.prisma.teamMember.upsert({
      where: { teamId_memberId: { teamId, memberId } },
      create: { teamId, memberId },
      update: {},
    });
  }

  async removeMember(workspaceId: string, teamId: string, memberId: string) {
    await this.findOne(workspaceId, teamId);
    await this.prisma.teamMember.delete({
      where: { teamId_memberId: { teamId, memberId } },
    });
  }
}
