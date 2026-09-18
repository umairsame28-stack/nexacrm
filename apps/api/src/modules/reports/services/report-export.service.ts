import { Injectable, BadRequestException } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { SalesReportService } from './sales-report.service';
import { RevenueReportService } from './revenue-report.service';
import { AgentPerformanceService } from './agent-performance.service';
import { PipelineReportService } from './pipeline-report.service';
import { WhatsAppAnalyticsService } from './whatsapp-analytics.service';

@Injectable()
export class ReportExportService {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly revenueReport: RevenueReportService,
    private readonly agentReport: AgentPerformanceService,
    private readonly pipelineReport: PipelineReportService,
    private readonly whatsappReport: WhatsAppAnalyticsService,
  ) {}

  async exportCsv(
    workspaceId: string,
    report: string,
    from: Date,
    to: Date,
  ): Promise<{ csv: string; filename: string }> {
    let rows: Record<string, unknown>[] = [];
    const dateStr = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`;

    switch (report) {
      case 'sales': {
        const data = await this.salesReport.getSalesReport(workspaceId, from, to);
        rows = data.byAgent.map((a) => ({
          Agent: a.name,
          'Deals Won': a.won,
          'Deals Lost': a.lost,
          'Revenue (USD)': a.revenue,
          'Win Rate (%)': a.won + a.lost > 0
            ? Math.round((a.won / (a.won + a.lost)) * 100)
            : 0,
        }));
        break;
      }

      case 'revenue': {
        const data = await this.revenueReport.getRevenueReport(workspaceId, from, to);
        rows = data.monthly.map((m) => ({
          Month: m.month,
          'Actual Revenue': m.actual,
          'Forecast': m.forecast,
          'Pipeline Value': m.pipeline,
          'Deals Won': m.deals,
        }));
        break;
      }

      case 'agent-performance': {
        const data = await this.agentReport.getAgentPerformance(workspaceId, from, to);
        rows = data.data.map((a) => ({
          Agent: a.name,
          'Conversations Handled': a.conversationsHandled,
          'Deals Won': a.dealsWon,
          'Revenue Generated': a.revenueGenerated,
          'Tasks Completed': a.tasksCompleted,
          'Avg Response Time (min)': a.avgResponseTimeMinutes ?? 'N/A',
        }));
        break;
      }

      case 'pipeline': {
        const data = await this.pipelineReport.getPipelineReport(workspaceId);
        rows = data.pipelines.flatMap((p) =>
          p.stages.map((s) => ({
            Pipeline: p.pipelineName,
            Stage: s.stageName,
            'Deal Count': s.dealCount,
            'Total Value': s.totalValue,
            'Weighted Value': s.weightedValue,
            'Win Probability (%)': s.probability,
            'Avg Time in Stage (days)': s.avgTimeInStageDays ?? 'N/A',
            'Conversion to Next (%)': s.conversionRateToNext ?? 'N/A',
          })),
        );
        break;
      }

      case 'whatsapp': {
        const data = await this.whatsappReport.getWhatsAppAnalytics(workspaceId, from, to);
        rows = data.dailyVolume.map((d) => ({
          Date: d.date,
          'Messages Sent': d.sent,
          'Messages Received': d.received,
        }));
        break;
      }

      default:
        throw new BadRequestException(`Unknown report type: ${report}`);
    }

    if (!rows.length) {
      rows = [{ message: 'No data available for the selected period' }];
    }

    const csv = stringify(rows, { header: true });
    return { csv, filename: `nexacrm_${report}_${dateStr}.csv` };
  }
}
