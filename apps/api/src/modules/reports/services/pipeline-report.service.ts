import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PipelineReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getPipelineReport(workspaceId: string, pipelineId?: string) {
    const pipelines = pipelineId
      ? await this.prisma.dealPipeline.findMany({ where: { id: pipelineId, workspaceId } })
      : await this.prisma.dealPipeline.findMany({ where: { workspaceId } });

    const reports = await Promise.all(
      pipelines.map(async (pipeline) => {
        const stages = await this.prisma.dealStage.findMany({
          where: { pipelineId: pipeline.id },
          orderBy: { sortOrder: 'asc' },
        });

        const stageData = await Promise.all(
          stages.map(async (stage) => {
            const [deals, avgAgeDays] = await Promise.all([
              this.prisma.deal.aggregate({
                where: { workspaceId, stageId: stage.id, status: 'OPEN', deletedAt: null },
                _count: { id: true },
                _sum: { value: true },
              }),
              this.getAvgTimeInStage(workspaceId, stage.id),
            ]);

            const nextStage = stages.find((s) => s.sortOrder === stage.sortOrder + 1);
            const conversionRate = nextStage
              ? await this.getStageConversionRate(workspaceId, stage.id, nextStage.id)
              : null;

            return {
              stageId: stage.id,
              stageName: stage.name,
              color: stage.color,
              sortOrder: stage.sortOrder,
              probability: stage.probability,
              dealCount: deals._count.id ?? 0,
              totalValue: Number(deals._sum.value ?? 0),
              weightedValue: Math.round(
                Number(deals._sum.value ?? 0) * (stage.probability / 100),
              ),
              avgTimeInStageDays: avgAgeDays,
              conversionRateToNext: conversionRate,
            };
          }),
        );

        const totalPipelineValue = stageData.reduce((s, d) => s + d.totalValue, 0);
        const totalWeightedValue = stageData.reduce((s, d) => s + d.weightedValue, 0);

        return {
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          currency: pipeline.currency,
          totalPipelineValue,
          totalWeightedValue,
          stages: stageData,
        };
      }),
    );

    return { pipelines: reports };
  }

  private async getAvgTimeInStage(workspaceId: string, stageId: string): Promise<number | null> {
    // Use history records to estimate time spent in stage
    const histories = await this.prisma.dealHistory.findMany({
      where: { field: 'stageId', newValue: stageId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (!histories.length) return null;

    let totalDays = 0;
    let count = 0;

    for (const entry of histories) {
      const nextChange = await this.prisma.dealHistory.findFirst({
        where: {
          dealId: entry.dealId,
          field: 'stageId',
          createdAt: { gt: entry.createdAt },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (nextChange) {
        const days =
          (nextChange.createdAt.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
        count++;
      }
    }

    return count > 0 ? Math.round(totalDays / count) : null;
  }

  private async getStageConversionRate(
    workspaceId: string,
    fromStageId: string,
    toStageId: string,
  ): Promise<number | null> {
    const [movedFrom, movedTo] = await Promise.all([
      this.prisma.dealHistory.count({
        where: { field: 'stageId', oldValue: fromStageId },
      }),
      this.prisma.dealHistory.count({
        where: { field: 'stageId', oldValue: fromStageId, newValue: toStageId },
      }),
    ]);

    if (!movedFrom) return null;
    return Math.round((movedTo / movedFrom) * 1000) / 10;
  }
}
