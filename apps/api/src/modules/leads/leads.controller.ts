import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';
import { PipelinesService } from './pipelines.service';
import { PipelineStagesService } from './pipeline-stages.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  LeadFilterDto,
  MoveLeadStageDto,
  ConvertLeadDto,
  CreatePipelineDto,
  CreatePipelineStageDto,
  ReorderStagesDto,
} from './dto/create-lead.dto';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Leads')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller()
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly pipelinesService: PipelinesService,
    private readonly stagesService: PipelineStagesService,
  ) {}

  // ─── Pipelines ──────────────────────────────────────────────────────────────

  @Get('pipelines')
  @ApiOperation({ summary: 'List lead pipelines' })
  async listPipelines(@WorkspaceId() workspaceId: string) {
    return this.pipelinesService.findAll(workspaceId);
  }

  @Post('pipelines')
  @ApiOperation({ summary: 'Create a pipeline' })
  async createPipeline(@WorkspaceId() workspaceId: string, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(workspaceId, dto);
  }

  @Get('pipelines/:id/stages')
  @ApiOperation({ summary: 'List pipeline stages' })
  async listStages(@Param('id') pipelineId: string) {
    return this.stagesService.findAll(pipelineId);
  }

  @Post('pipelines/:id/stages')
  @ApiOperation({ summary: 'Create a pipeline stage' })
  async createStage(@Param('id') pipelineId: string, @Body() dto: CreatePipelineStageDto) {
    return this.stagesService.create(pipelineId, dto);
  }

  @Patch('pipelines/:id/stages/:stageId')
  @ApiOperation({ summary: 'Update a pipeline stage' })
  async updateStage(
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: Partial<CreatePipelineStageDto>,
  ) {
    return this.stagesService.update(pipelineId, stageId, dto);
  }

  @Delete('pipelines/:id/stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pipeline stage' })
  async deleteStage(@Param('id') pipelineId: string, @Param('stageId') stageId: string) {
    await this.stagesService.remove(pipelineId, stageId);
  }

  @Post('pipelines/:id/stages/reorder')
  @ApiOperation({ summary: 'Reorder pipeline stages' })
  async reorderStages(@Param('id') pipelineId: string, @Body() dto: ReorderStagesDto) {
    return this.stagesService.reorder(pipelineId, dto);
  }

  // ─── Leads ──────────────────────────────────────────────────────────────────

  @Get('leads')
  @ApiOperation({ summary: 'List leads with filtering' })
  async findAll(@WorkspaceId() workspaceId: string, @Query() filter: LeadFilterDto) {
    return this.leadsService.findAll(workspaceId, filter);
  }

  @Get('leads/kanban')
  @ApiOperation({ summary: 'Get leads in Kanban view grouped by stage' })
  async getKanban(@WorkspaceId() workspaceId: string, @Query('pipelineId') pipelineId?: string) {
    return this.leadsService.getKanban(workspaceId, pipelineId);
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create a lead' })
  async create(
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.create(workspaceId, dto, user.id);
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead detail' })
  async findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.leadsService.findById(workspaceId, id);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update a lead' })
  async update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<UpdateLeadDto>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.update(workspaceId, id, dto, user.id);
  }

  @Delete('leads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  async remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.leadsService.remove(workspaceId, id);
  }

  @Patch('leads/:id/stage')
  @ApiOperation({ summary: 'Move lead to a different stage' })
  async moveStage(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: MoveLeadStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.moveStage(workspaceId, id, dto.stageId, user.id);
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convert lead to deal' })
  async convert(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.convertToDeal(workspaceId, id, dto, user.id);
  }

  @Get('leads/:id/history')
  @ApiOperation({ summary: 'Get lead history' })
  async getHistory(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.leadsService.getHistory(workspaceId, id);
  }
}
