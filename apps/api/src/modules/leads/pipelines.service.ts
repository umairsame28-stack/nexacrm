import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-lead.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreatePipelineDto) {
    const existing = await this.prisma.pipeline.findFirst({
      where: { workspaceId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('A pipeline with this name already exists');

    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.pipeline.count({ where: { workspaceId } });

    return this.prisma.pipeline.create({
      data: { workspaceId, name: dto.name, isDefault: dto.isDefault ?? false, sortOrder: count },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.pipeline.findMany({
      where: { workspaceId },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(workspaceId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, workspaceId },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  async update(workspaceId: string, id: string, dto: Partial<CreatePipelineDto>) {
    await this.findOne(workspaceId, id);
    return this.prisma.pipeline.update({ where: { id }, data: dto });
  }

  async remove(workspaceId: string, id: string) {
    const pipeline = await this.findOne(workspaceId, id);
    if (pipeline.isDefault) throw new ConflictException('Cannot delete the default pipeline');
    await this.prisma.pipeline.delete({ where: { id } });
  }
}
