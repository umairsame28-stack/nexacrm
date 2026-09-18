import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { startOfDay, endOfDay, parseISO, format, subDays, eachDayOfInterval } from 'date-fns';

@Injectable()
export class SalesReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(
    workspaceId: string,
    from: Date,
    to: Date,
    agentId?: string,
    pipelineId?: string,
  ) {
    const baseWhere = {
      workspaceId,
      deletedAt: null,
      closedAt: { gte: from, lte: to },
      ...(agentId && { assignedToId: agentId }),
      ...(pipelineId && { pipelineId }),
    };

    const [wonDeals, lostDeals, allWonAgents, trend] = await Promise.all([
      // Won deals aggregate
      this.prisma.deal.aggregate({
        where: { ...baseWhere, status: 'WON' },
        _count: { id: true },
        _sum: { value: true },
        _avg: { value: true },
      }),

      // Lost deals count
      this.prisma.deal.count({ where: { ...baseWhere, status: 'LOST' } }),

      // By-agent breakdown
      this.prisma.deal.groupBy({
        by: ['assignedToId'],
        where: { ...baseWhere, status: 'WON' },
        _count: { id: true },
        _sum: { value: true },
      }),

      // Daily trend
      this.getDailyTrend(workspaceId, from, to, agentId, pipelineId),
    ]);

    const totalDeals = (wonDeals._count.id ?? 0) + lostDeals;
    const winRate =
      totalDeals > 0
        ? Math.round(((wonDeals._count.id ?? 0) / totalDeals) * 1000) / 10
        : 0;

    // Enrich agent breakdown with names
    const agentIds = allWonAgents.map((a) => a.assignedToId).filter(Boolean) as string[];
    const agents = await this.prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const agentMap = new Map(agents.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));

    // Lost by-agent breakdown
    const lostByAgent = await this.prisma.deal.groupBy({
      by: ['assignedToId'],
      where: { ...baseWhere, status: 'LOST' },
      _count: { id: true },
    });
    const lostAgentMap = new Map(lostByAgent.map((a) => [a.assignedToId, a._count.id]));

    return {
      period: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
      totalDeals,
      wonDeals: wonDeals._count.id ?? 0,
      lostDeals,
      totalRevenue: Number(wonDeals._sum.value ?? 0),
      avgDealValue: Number(wonDeals._avg.value ?? 0),
      winRate,
      byAgent: allWonAgents.map((a) => ({
        agentId: a.assignedToId,
        name: agentMap.get(a.assignedToId!) ?? 'Unassigned',
        won: a._count.id,
        lost: lostAgentMap.get(a.assignedToId!) ?? 0,
        revenue: Number(a._sum.value ?? 0),
      })),
      trend,
    };
  }

  private async getDailyTrend(
    workspaceId: string,
    from: Date,
    to: Date,
    agentId?: string,
    pipelineId?: string,
  ) {
    const days = eachDayOfInterval({ start: from, end: to });

    return Promise.all(
      days.map(async (day) => {
        const agg = await this.prisma.deal.aggregate({
          where: {
            workspaceId,
            status: 'WON',
            closedAt: { gte: startOfDay(day), lte: endOfDay(day) },
            ...(agentId && { assignedToId: agentId }),
            ...(pipelineId && { pipelineId }),
          },
          _sum: { value: true },
          _count: { id: true },
        });
        return {
          date: format(day, 'yyyy-MM-dd'),
          revenue: Number(agg._sum.value ?? 0),
          deals: agg._count.id ?? 0,
        };
      }),
    );
  }
}
