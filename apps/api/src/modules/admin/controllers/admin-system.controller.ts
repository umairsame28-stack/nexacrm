import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AdminSystemService } from '../services/admin-system.service';

@ApiTags('Admin - System')
@ApiBearerAuth('JWT')
@UseGuards(SuperAdminGuard)
@Controller('admin/system')
export class AdminSystemController {
  constructor(private readonly adminSystemService: AdminSystemService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide statistics dashboard (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved' })
  async getSystemStats() {
    return this.adminSystemService.getSystemStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent system-wide activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of activities to retrieve' })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminSystemService.getRecentActivity(limit);
  }

  @Get('failed-logins')
  @ApiOperation({ summary: 'Get failed login attempts for security monitoring' })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Time range in hours' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' })
  @ApiResponse({ status: 200, description: 'Failed login attempts retrieved' })
  async getFailedLogins(
    @Query('hours') hours?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminSystemService.getFailedLogins(hours, limit);
  }

  @Get('growth/users')
  @ApiOperation({ summary: 'Get user growth statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days' })
  @ApiResponse({ status: 200, description: 'User growth data retrieved' })
  async getUserGrowth(@Query('days') days?: number) {
    return this.adminSystemService.getUserGrowth(days);
  }

  @Get('growth/workspaces')
  @ApiOperation({ summary: 'Get workspace growth statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days' })
  @ApiResponse({ status: 200, description: 'Workspace growth data retrieved' })
  async getWorkspaceGrowth(@Query('days') days?: number) {
    return this.adminSystemService.getWorkspaceGrowth(days);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ status: 200, description: 'System health metrics retrieved' })
  async getSystemHealth() {
    return this.adminSystemService.getSystemHealth();
  }

  @Get('super-admins')
  @ApiOperation({ summary: 'Get list of all super admins' })
  @ApiResponse({ status: 200, description: 'Super admins list retrieved' })
  async getSuperAdmins() {
    return this.adminSystemService.getSuperAdmins();
  }
}
