import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { AdminWorkspacesService } from '../services/admin-workspaces.service';
import { WorkspaceQueryDto, UpdateWorkspaceStatusDto } from '../dto/admin-workspace.dto';

@ApiTags('Admin - Workspaces')
@ApiBearerAuth('JWT')
@UseGuards(SuperAdminGuard)
@Controller('admin/workspaces')
export class AdminWorkspacesController {
  constructor(private readonly adminWorkspacesService: AdminWorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workspaces (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved successfully' })
  async getAllWorkspaces(@Query() query: WorkspaceQueryDto) {
    return this.adminWorkspacesService.getAllWorkspaces(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID with detailed information' })
  @ApiResponse({ status: 200, description: 'Workspace details retrieved' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspaceById(@Param('id') id: string) {
    return this.adminWorkspacesService.getWorkspaceById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get workspace statistics' })
  @ApiResponse({ status: 200, description: 'Workspace statistics retrieved' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspaceStats(@Param('id') id: string) {
    return this.adminWorkspacesService.getWorkspaceStats(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend or activate workspace' })
  @ApiResponse({ status: 200, description: 'Workspace status updated' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspaceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminWorkspacesService.updateWorkspaceStatus(
      id,
      dto.isActive,
      dto.reason,
      admin.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete workspace permanently (use with caution)' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async deleteWorkspace(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminWorkspacesService.deleteWorkspace(id, admin.id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get workspace activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved' })
  async getWorkspaceActivity(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminWorkspacesService.getWorkspaceActivity(id, page, limit);
  }
}
