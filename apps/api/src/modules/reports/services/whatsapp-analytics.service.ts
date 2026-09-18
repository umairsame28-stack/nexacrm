import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class WhatsAppAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhatsAppAnalytics(workspaceId: string, from: Date, to: Date, agentId?: string) {
    const msgWhere = {
      workspaceId,
      createdAt: { gte: from, lte: to },
    };

    const [messagesSent, messagesReceived, templateUsage, broadcastStats] = await Promise.all([
      // Outbound messages
      this.prisma.message.count({
        where: { ...msgWhere, direction: 'OUTBOUND', status: { not: 'SCHEDULED' } },
      }),

      // Inbound messages
      this.prisma.message.count({
        where: { ...msgWhere, direction: 'INBOUND' },
      }),

      // Template usage grouped by name
      this.prisma.message.groupBy({
        by: ['templateName'],
        where: { ...msgWhere, type: 'TEMPLATE', templateName: { not: null } },
        _count: { id: true },
      }),

      // Broadcast stats
      this.prisma.broadcast.aggregate({
        where: { workspaceId, status: 'SENT', completedAt: { gte: from, lte: to } },
        _count: { id: true },
        _sum: { sentCount: true },
      }),
    ]);

    // Response time stats
    const responseTime = await this.calculateResponseTimeStats(workspaceId, from, to, agentId);

    // Daily volume trend
    const dailyVolume = await this.getDailyVolume(workspaceId, from, to);

    // Template performance (delivered + read rates from broadcast recipients)
    const templatePerformance = await Promise.all(
      templateUsage.map(async (tpl) => {
        const [delivered, read] = await Promise.all([
          this.prisma.message.count({
            where: { ...msgWhere, templateName: tpl.templateName, status: 'DELIVERED' },
          }),
          this.prisma.message.count({
            where: { ...msgWhere, templateName: tpl.templateName, status: 'READ' },
          }),
        ]);
        return {
          templateName: tpl.templateName,
          sent: tpl._count.id,
          delivered,
          read,
        };
      }),
    );

    return {
      period: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
      messagesSent,
      messagesReceived,
      avgFirstResponseMinutes: responseTime.avg,
      p95FirstResponseMinutes: responseTime.p95,
      templatesUsed: templatePerformance.filter((t) => t.templateName),
      broadcastsDelivered: broadcastStats._count.id ?? 0,
      broadcastReach: broadcastStats._sum.sentCount ?? 0,
      dailyVolume,
    };
  }

  private async calculateResponseTimeStats(
    workspaceId: string,
    from: Date,
    to: Date,
    agentId?: string,
  ): Promise<{ avg: number | null; p95: number | null }> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        workspaceId,
        ...(agentId && { assignedToId: agentId }),
        lastMessageAt: { gte: from, lte: to },
      },
      select: { id: true },
      take: 200,
    });

    const responseTimes: number[] = [];

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
          createdAt: { gt: firstInbound.createdAt },
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      if (!firstOutbound) continue;

      const mins =
        (firstOutbound.createdAt.getTime() - firstInbound.createdAt.getTime()) / 1000 / 60;
      responseTimes.push(mins);
    }

    if (!responseTimes.length) return { avg: null, p95: null };

    responseTimes.sort((a, b) => a - b);
    const avg = Math.round(responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length);
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p95 = Math.round(responseTimes[Math.min(p95Index, responseTimes.length - 1)]);

    return { avg, p95 };
  }

  private async getDailyVolume(workspaceId: string, from: Date, to: Date) {
    const days = eachDayOfInterval({ start: from, end: to });

    return Promise.all(
      days.map(async (day) => {
        const [sent, received] = await Promise.all([
          this.prisma.message.count({
            where: {
              workspaceId,
              direction: 'OUTBOUND',
              createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
            },
          }),
          this.prisma.message.count({
            where: {
              workspaceId,
              direction: 'INBOUND',
              createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
            },
          }),
        ]);
        return { date: format(day, 'yyyy-MM-dd'), sent, received };
      }),
    );
  }
}
