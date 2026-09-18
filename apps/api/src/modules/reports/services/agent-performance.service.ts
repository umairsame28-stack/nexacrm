import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { startOfMonth } from 'date-fns';

@Injectable()
export class AgentPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentPerformance(workspaceId: string, from: Date, to: Date, agentId?: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        isActive: true,
        ...(agentId && { userId: agentId }),
        role: { in: ['SALES_AGENT', 'SUPPORT_AGENT', 'MANAGER'] },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    const data = await Promise.all(
      members.map(async (member) => {
        const userId = member.userId;

        const [conversationsHandled, dealsWon, revenueGenerated, tasksCompleted, avgResponseMs] =
          await Promise.all([
            // Conversations assigned in period
            this.prisma.conversation.count({
              where: { workspaceId, assignedToId: userId },
            }),

            // Deals won in period
            this.prisma.deal.count({
              where: {
                workspaceId,
                assignedToId: userId,
                status: 'WON',
                closedAt: { gte: from, lte: to },
              },
            }),

            // Revenue from won deals
            this.prisma.deal.aggregate({
              where: {
                workspaceId,
                assignedToId: userId,
                status: 'WON',
                closedAt: { gte: from, lte: to },
              },
              _sum: { value: true },
            }),

            // Tasks completed in period
            this.prisma.task.count({
              where: {
                workspaceId,
                assignedToId: userId,
                status: 'DONE',
                completedAt: { gte: from, lte: to },
              },
            }),

            // Average first response time (ms): time between first INBOUND message and first OUTBOUND
            this.calculateAvgResponseTime(workspaceId, userId, from, to),
          ]);

        return {
          agentId: userId,
          name: `${member.user.firstName} ${member.user.lastName}`,
          avatarUrl: member.user.avatarUrl,
          conversationsHandled,
          dealsWon,
          revenueGenerated: Number(revenueGenerated._sum.value ?? 0),
          tasksCompleted,
          avgResponseTimeMinutes:
            avgResponseMs > 0 ? Math.round(avgResponseMs / 1000 / 60) : null,
        };
      }),
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      data: data.sort((a, b) => b.revenueGenerated - a.revenueGenerated),
    };
  }

  private async calculateAvgResponseTime(
    workspaceId: string,
    userId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    // Find conversations assigned to this agent where there's an inbound message followed by an outbound
    const conversations = await this.prisma.conversation.findMany({
      where: { workspaceId, assignedToId: userId },
      select: { id: true },
      take: 100,
    });

    if (!conversations.length) return 0;

    let totalMs = 0;
    let count = 0;

    for (const conv of conversations) {
      const firstInbound = await this.prisma.message.findFirst({
        where: { conversationId: conv.id, direction: 'INBOUND', createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      if (!firstInbound) continue;

      const firstOutbound = await this.prisma.message.findFirst({
        where: {
          conversationId: conv.id,
          direction: 'OUTBOUND',
          senderId: userId,
          createdAt: { gt: firstInbound.createdAt },
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      if (!firstOutbound) continue;

      totalMs += firstOutbound.createdAt.getTime() - firstInbound.createdAt.getTime();
      count++;
    }

    return count > 0 ? totalMs / count : 0;
  }
}
