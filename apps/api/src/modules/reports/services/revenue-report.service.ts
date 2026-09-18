import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';

@Injectable()
export class RevenueReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueReport(workspaceId: string, from: Date, to: Date) {
    const months = eachMonthOfInterval({ start: from, end: to });

    const monthly = await Promise.all(
      months.map(async (month) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);

        const [actual, forecast] = await Promise.all([
          // Actual: won deals closed in this month
          this.prisma.deal.aggregate({
            where: {
              workspaceId,
              status: 'WON',
              closedAt: { gte: mStart, lte: mEnd },
            },
            _sum: { value: true },
            _count: { id: true },
          }),
          // Forecast: open deals expected to close in this month
          this.prisma.deal.findMany({
            where: {
              workspaceId,
              status: 'OPEN',
              expectedCloseDate: { gte: mStart, lte: mEnd },
            },
            include: { stage: { select: { probability: true } } },
          }),
        ]);

        const forecastValue = forecast.reduce(
          (sum, d) => sum + Number(d.value) * (d.stage.probability / 100),
          0,
        );

        return {
          month: format(month, 'yyyy-MM'),
          actual: Number(actual._sum.value ?? 0),
          deals: actual._count.id ?? 0,
          forecast: Math.round(forecastValue),
          pipeline: forecast.reduce((sum, d) => sum + Number(d.value), 0),
        };
      }),
    );

    const totalActual = monthly.reduce((s, m) => s + m.actual, 0);
    const totalForecast = monthly.reduce((s, m) => s + m.forecast, 0);

    // MoM growth (last two full months)
    const lastMonth = monthly[monthly.length - 1];
    const prevMonth = monthly[monthly.length - 2];
    const momGrowth =
      prevMonth && prevMonth.actual > 0
        ? Math.round(((lastMonth.actual - prevMonth.actual) / prevMonth.actual) * 1000) / 10
        : 0;

    return {
      period: { from: format(from, 'yyyy-MM'), to: format(to, 'yyyy-MM') },
      totalActual,
      totalForecast,
      momGrowth,
      monthly,
    };
  }
}
