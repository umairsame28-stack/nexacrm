import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { TeamsService } from './teams.service';
import { DepartmentsService } from './departments.service';
import { CreateTeamDto, AddTeamMemberDto } from './dto/create-team.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import type { WorkspaceMemberRole } from '@prisma/client';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Teams')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller()
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  // ─── Departments ────────────────────────────────────────────────────────────

  @Get('departments')
  @ApiOperation({ summary: 'List all departments' })
  async listDepartments(@WorkspaceId() workspaceId: string) {
    return this.departmentsService.list(workspaceId);
  }

  @Post('departments')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Create a department' })
  async createDepartment(@WorkspaceId() workspaceId: string, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(workspaceId, dto);
  }

  @Delete('departments/:id')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department' })
  async deleteDepartment(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.departmentsService.remove(workspaceId, id);
  }

  // ─── Teams ──────────────────────────────────────────────────────────────────

  @Get('teams')
  @ApiOperation({ summary: 'List all teams' })
  async listTeams(@WorkspaceId() workspaceId: string) {
    return this.teamsService.list(workspaceId);
  }

  @Post('teams')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Create a team' })
  async createTeam(@WorkspaceId() workspaceId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(workspaceId, dto);
  }

  @Patch('teams/:id')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Update a team' })
  async updateTeam(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTeamDto>,
  ) {
    return this.teamsService.update(workspaceId, id, dto);
  }

  @Delete('teams/:id')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  async deleteTeam(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.teamsService.remove(workspaceId, id);
  }

  @Post('teams/:id/members')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Add a member to a team' })
  async addTeamMember(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(workspaceId, id, dto.memberId);
  }

  @Delete('teams/:id/members/:memberId')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a team' })
  async removeTeamMember(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.teamsService.removeMember(workspaceId, id, memberId);
  }
}
