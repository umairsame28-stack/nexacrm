import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealPipelineDto, CreateDealStageDto } from './dto/create-deal.dto';

@Injectable()
export class DealPipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateDealPipelineDto) {
    const existing = await this.prisma.dealPipeline.findFirst({
      where: { workspaceId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('A deal pipeline with this name already exists');

    if (dto.isDefault) {
      await this.prisma.dealPipeline.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.dealPipeline.create({
      data: {
        workspaceId,
        name: dto.name,
        currency: dto.currency ?? 'USD',
        isDefault: dto.isDefault ?? false,
      },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.dealPipeline.findMany({
      where: { workspaceId },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(workspaceId: string, id: string) {
    const pipeline = await this.prisma.dealPipeline.findFirst({
      where: { id, workspaceId },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!pipeline) throw new NotFoundException('Deal pipeline not found');
    return pipeline;
  }

  async createStage(pipelineId: string, dto: CreateDealStageDto) {
    return this.prisma.dealStage.create({
      data: {
        pipelineId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
        sortOrder: dto.sortOrder,
        probability: dto.probability ?? 0,
        isWon: dto.isWon ?? false,
        isLost: dto.isLost ?? false,
      },
    });
  }

  async getStages(pipelineId: string) {
    return this.prisma.dealStage.findMany({
      where: { pipelineId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateStage(pipelineId: string, stageId: string, dto: Partial<CreateDealStageDto>) {
    const stage = await this.prisma.dealStage.findFirst({ where: { id: stageId, pipelineId } });
    if (!stage) throw new NotFoundException('Deal stage not found');
    return this.prisma.dealStage.update({ where: { id: stageId }, data: dto });
  }

  async removeStage(pipelineId: string, stageId: string) {
    const stage = await this.prisma.dealStage.findFirst({ where: { id: stageId, pipelineId } });
    if (!stage) throw new NotFoundException('Deal stage not found');
    if (stage.isWon || stage.isLost) {
      throw new ConflictException('Cannot delete won/lost terminal stages');
    }
    await this.prisma.dealStage.delete({ where: { id: stageId } });
  }
}
