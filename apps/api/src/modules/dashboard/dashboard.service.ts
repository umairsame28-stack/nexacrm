import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(workspaceId: string, userId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      totalContacts,
      activeConversations,
      openLeads,
      closedDealsThisMonth,
      prevMonthDeals,
      salesTrend,
      customerGrowth,
      teamPerformance,
      activityFeed,
      upcomingTasks,
      todayEvents,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { workspaceId, deletedAt: null } }),

      this.prisma.conversation.count({ where: { workspaceId, status: 'OPEN' } }),

      this.prisma.lead.count({ where: { workspaceId, deletedAt: null, status: { notIn: ['CONVERTED', 'LOST'] } } }),

      this.prisma.deal.aggregate({
        where: { workspaceId, status: 'WON', closedAt: { gte: monthStart, lte: monthEnd } },
        _count: { id: true },
        _sum: { value: true },
      }),

      this.prisma.deal.aggregate({
        where: { workspaceId, status: 'WON', closedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { value: true },
      }),

      this.getSalesTrend(workspaceId, 30),
      this.getCustomerGrowth(workspaceId, 30),
      this.getTeamPerformance(workspaceId),

      this.prisma.auditLog.findMany({
        where: { workspaceId, createdAt: { gte: subDays(now, 1) } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),

      this.prisma.task.findMany({
        where: {
          workspaceId,
          assignedToId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueAt: { gte: now, lte: subDays(now, -7) },
          deletedAt: null,
        },
        include: { contact: { select: { firstName: true, lastName: true } } },
        orderBy: { dueAt: 'asc' },
        take: 5,
      }),

      this.prisma.calendarEvent.findMany({
        where: {
          workspaceId,
          startAt: { gte: startOfDay(now), lte: endOfDay(now) },
        },
        include: { attendees: true },
        orderBy: { startAt: 'asc' },
        take: 10,
      }),
    ]);

    const revenueThisMonth = Number(closedDealsThisMonth._sum.value ?? 0);
    const revenuePrevMonth = Number(prevMonthDeals._sum.value ?? 0);
    const revenueChange =
      revenuePrevMonth > 0
        ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 1000) / 10
        : 0;

    // Conversion rate: won deals / (won + lost) this month
    const lostDeals = await this.prisma.deal.count({
      where: { workspaceId, status: 'LOST', closedAt: { gte: monthStart, lte: monthEnd } },
    });
    const totalClosed = (closedDealsThisMonth._count.id ?? 0) + lostDeals;
    const conversionRate =
      totalClosed > 0
        ? Math.round(((closedDealsThisMonth._count.id ?? 0) / totalClosed) * 1000) / 10
        : 0;

    return {
      kpis: {
        totalContacts,
        activeConversations,
        openLeads,
        closedDealsThisMonth: closedDealsThisMonth._count.id ?? 0,
        revenueThisMonth,
        revenuePrevMonth,
        revenueChange,
        conversionRate,
      },
      salesTrend,
      customerGrowth,
      teamPerformance,
      activityFeed: activityFeed.map((a) => ({
        type: a.action,
        actor: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
        resource: a.resource,
        resourceId: a.resourceId,
        at: a.createdAt,
      })),
      upcomingTasks,
      todayEvents,
    };
  }

  private async getSalesTrend(workspaceId: string, days: number) {
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const agg = await this.prisma.deal.aggregate({
        where: { workspaceId, status: 'WON', closedAt: { gte: dayStart, lte: dayEnd } },
        _sum: { value: true },
        _count: { id: true },
      });

      results.push({
        date: format(date, 'yyyy-MM-dd'),
        revenue: Number(agg._sum.value ?? 0),
        deals: agg._count.id ?? 0,
      });
    }
    return results;
  }

  private async getCustomerGrowth(workspaceId: string, days: number) {
    const results = [];
    let cumulative = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const newContacts = await this.prisma.contact.count({
        where: { workspaceId, createdAt: { gte: dayStart, lte: dayEnd }, deletedAt: null },
      });

      cumulative += newContacts;
      results.push({ date: format(date, 'yyyy-MM-dd'), newContacts, cumulative });
    }
    return results;
  }

  private async getTeamPerformance(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      take: 20,
    });

    const now = new Date();
    const monthStart = startOfMonth(now);

    return Promise.all(
      members.map(async (m) => {
        const [conversations, dealsWon, avgResponse] = await Promise.all([
          this.prisma.conversation.count({
            where: { workspaceId, assignedToId: m.userId },
          }),
          this.prisma.deal.count({
            where: { workspaceId, assignedToId: m.userId, status: 'WON', closedAt: { gte: monthStart } },
          }),
          Promise.resolve(0), // Avg response time would require message timing analytics
        ]);

        return {
          agentId: m.userId,
          name: `${m.user.firstName} ${m.user.lastName}`,
          conversations,
          dealsWon,
          avgResponseMins: avgResponse,
        };
      }),
    );
  }
}
