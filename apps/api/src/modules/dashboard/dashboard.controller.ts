import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Dashboard')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dashboard KPIs and charts in one request' })
  async getDashboard(
    @WorkspaceId() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getDashboard(workspaceId, user.id);
  }
}
