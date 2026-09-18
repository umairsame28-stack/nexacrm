import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { SalesReportService } from './services/sales-report.service';
import { RevenueReportService } from './services/revenue-report.service';
import { AgentPerformanceService } from './services/agent-performance.service';
import { PipelineReportService } from './services/pipeline-report.service';
import { WhatsAppAnalyticsService } from './services/whatsapp-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { ReportFilterDto, ExportReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { subDays } from 'date-fns';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Reports')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles('ADMINISTRATOR', 'OWNER', 'MANAGER', 'VIEWER')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly revenueReport: RevenueReportService,
    private readonly agentReport: AgentPerformanceService,
    private readonly pipelineReport: PipelineReportService,
    private readonly whatsappReport: WhatsAppAnalyticsService,
    private readonly exportService: ReportExportService,
  ) {}

  private parseDates(filter: ReportFilterDto): { from: Date; to: Date } {
    const to = filter.to ? new Date(filter.to) : new Date();
    const from = filter.from ? new Date(filter.from) : subDays(to, 30);
    return { from, to };
  }

  @Get('sales')
  @ApiOperation({ summary: 'Sales report — deals won/lost by period and agent' })
  getSales(@CurrentUser() user: AuthenticatedUser, @Query() filter: ReportFilterDto) {
    const { from, to } = this.parseDates(filter);
    return this.salesReport.getSalesReport(
      user.workspaceId, from, to, filter.agentId, filter.pipelineId,
    );
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Monthly revenue report with forecast' })
  getRevenue(@CurrentUser() user: AuthenticatedUser, @Query() filter: ReportFilterDto) {
    const { from, to } = this.parseDates(filter);
    return this.revenueReport.getRevenueReport(user.workspaceId, from, to);
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Agent performance — conversations, deals, response time' })
  getAgentPerformance(@CurrentUser() user: AuthenticatedUser, @Query() filter: ReportFilterDto) {
    const { from, to } = this.parseDates(filter);
    return this.agentReport.getAgentPerformance(
      user.workspaceId, from, to, filter.agentId,
    );
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Pipeline report — stage distribution and conversion rates' })
  getPipeline(@CurrentUser() user: AuthenticatedUser, @Query() filter: ReportFilterDto) {
    return this.pipelineReport.getPipelineReport(user.workspaceId, filter.pipelineId);
  }

  @Get('whatsapp')
  @ApiOperation({ summary: 'WhatsApp analytics — messages, templates, response time' })
  getWhatsApp(@CurrentUser() user: AuthenticatedUser, @Query() filter: ReportFilterDto) {
    const { from, to } = this.parseDates(filter);
    return this.whatsappReport.getWhatsAppAnalytics(
      user.workspaceId, from, to, filter.agentId,
    );
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export a report as CSV' })
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExportReportDto,
    @Res() res: Response,
  ) {
    const to = dto.to ? new Date(dto.to) : new Date();
    const from = dto.from ? new Date(dto.from) : subDays(to, 30);

    const { csv, filename } = await this.exportService.exportCsv(
      user.workspaceId,
      dto.report,
      from,
      to,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
