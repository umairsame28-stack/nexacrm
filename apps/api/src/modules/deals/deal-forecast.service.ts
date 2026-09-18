import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DealForecastService {
  constructor(private readonly prisma: PrismaService) {}

  async getForecast(workspaceId: string, pipelineId?: string) {
    let pipeline = null;
    if (pipelineId) {
      pipeline = await this.prisma.dealPipeline.findFirst({ where: { id: pipelineId, workspaceId } });
    } else {
      pipeline = await this.prisma.dealPipeline.findFirst({ where: { workspaceId, isDefault: true } });
    }
    if (!pipeline) return { stages: [], totalWeighted: 0, totalPipeline: 0 };

    const stages = await this.prisma.dealStage.findMany({
      where: { pipelineId: pipeline.id },
      include: {
        deals: {
          where: { workspaceId, status: 'OPEN', deletedAt: null },
          select: { value: true, probability: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    let totalWeighted = 0;
    let totalPipeline = 0;

    const stageData = stages.map((stage) => {
      const totalValue = stage.deals.reduce(
        (sum, d) => sum + Number(d.value),
        0,
      );
      const probability = stage.probability / 100;
      const weighted = totalValue * probability;

      totalPipeline += totalValue;
      totalWeighted += weighted;

      return {
        stageId: stage.id,
        name: stage.name,
        probability: stage.probability,
        totalValue,
        weightedValue: Math.round(weighted),
        dealCount: stage.deals.length,
      };
    });

    return {
      pipeline: pipeline.name,
      stages: stageData,
      totalWeighted: Math.round(totalWeighted),
      totalPipeline: Math.round(totalPipeline),
    };
  }
}
