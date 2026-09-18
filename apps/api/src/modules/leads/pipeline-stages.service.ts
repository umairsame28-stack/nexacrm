import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineStageDto, ReorderStagesDto } from './dto/create-lead.dto';

@Injectable()
export class PipelineStagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(pipelineId: string, dto: CreatePipelineStageDto) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
        sortOrder: dto.sortOrder,
        probability: dto.probability ?? 0,
      },
    });
  }

  async findAll(pipelineId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(pipelineId: string, stageId: string, dto: Partial<CreatePipelineStageDto>) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, pipelineId },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    return this.prisma.pipelineStage.update({ where: { id: stageId }, data: dto });
  }

  async remove(pipelineId: string, stageId: string) {
    const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId } });
    if (!stage) throw new NotFoundException('Stage not found');

    // Move leads in this stage to... nothing (soft-fail or require explicit migration)
    const leadCount = await this.prisma.lead.count({
      where: { stageId, deletedAt: null },
    });
    if (leadCount > 0) {
      throw new Error(`Cannot delete stage with ${leadCount} active leads`);
    }
    await this.prisma.pipelineStage.delete({ where: { id: stageId } });
  }

  async reorder(pipelineId: string, dto: ReorderStagesDto) {
    const updates = dto.stageIds.map((id, index) =>
      this.prisma.pipelineStage.updateMany({
        where: { id, pipelineId },
        data: { sortOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findAll(pipelineId);
  }
}
