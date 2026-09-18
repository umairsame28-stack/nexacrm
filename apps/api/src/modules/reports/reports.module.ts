import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { SalesReportService } from './services/sales-report.service';
import { RevenueReportService } from './services/revenue-report.service';
import { AgentPerformanceService } from './services/agent-performance.service';
import { PipelineReportService } from './services/pipeline-report.service';
import { WhatsAppAnalyticsService } from './services/whatsapp-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [
    SalesReportService,
    RevenueReportService,
    AgentPerformanceService,
    PipelineReportService,
    WhatsAppAnalyticsService,
    ReportExportService,
  ],
  exports: [
    SalesReportService,
    RevenueReportService,
    AgentPerformanceService,
    WhatsAppAnalyticsService,
  ],
})
export class ReportsModule {}
