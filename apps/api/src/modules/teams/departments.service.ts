import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { workspaceId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('A department with this name already exists');

    return this.prisma.department.create({
      data: { workspaceId, name: dto.name, description: dto.description },
    });
  }

  async list(workspaceId: string) {
    return this.prisma.department.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: { member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
        },
        teams: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, workspaceId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(workspaceId: string, id: string, dto: Partial<CreateDepartmentDto>) {
    await this.findOne(workspaceId, id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.department.delete({ where: { id } });
  }

  async addMember(workspaceId: string, departmentId: string, memberId: string) {
    await this.findOne(workspaceId, departmentId);
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Workspace member not found');

    return this.prisma.departmentMember.upsert({
      where: { departmentId_memberId: { departmentId, memberId } },
      create: { departmentId, memberId },
      update: {},
    });
  }

  async removeMember(workspaceId: string, departmentId: string, memberId: string) {
    await this.findOne(workspaceId, departmentId);
    await this.prisma.departmentMember.delete({
      where: { departmentId_memberId: { departmentId, memberId } },
    });
  }
}
