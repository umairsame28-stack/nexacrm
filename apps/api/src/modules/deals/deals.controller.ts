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
import { DealsService } from './deals.service';
import { DealPipelinesService } from './deal-pipelines.service';
import { DealForecastService } from './deal-forecast.service';
import {
  CreateDealDto,
  UpdateDealDto,
  DealFilterDto,
  MarkDealWonDto,
  MarkDealLostDto,
  CreateDealNoteDto,
  CreateDealPipelineDto,
  CreateDealStageDto,
} from './dto/create-deal.dto';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Deals')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller()
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly pipelinesService: DealPipelinesService,
    private readonly forecastService: DealForecastService,
  ) {}

  // ─── Deal Pipelines ─────────────────────────────────────────────────────────

  @Get('deal-pipelines')
  @ApiOperation({ summary: 'List deal pipelines' })
  async listPipelines(@WorkspaceId() workspaceId: string) {
    return this.pipelinesService.findAll(workspaceId);
  }

  @Post('deal-pipelines')
  @ApiOperation({ summary: 'Create a deal pipeline' })
  async createPipeline(@WorkspaceId() workspaceId: string, @Body() dto: CreateDealPipelineDto) {
    return this.pipelinesService.create(workspaceId, dto);
  }

  @Get('deal-pipelines/:id/stages')
  @ApiOperation({ summary: 'List deal pipeline stages' })
  async listStages(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.pipelinesService.getStages(id);
  }

  @Post('deal-pipelines/:id/stages')
  @ApiOperation({ summary: 'Create a deal stage' })
  async createStage(@Param('id') pipelineId: string, @Body() dto: CreateDealStageDto) {
    return this.pipelinesService.createStage(pipelineId, dto);
  }

  @Patch('deal-pipelines/:id/stages/:stageId')
  @ApiOperation({ summary: 'Update a deal stage' })
  async updateStage(
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: Partial<CreateDealStageDto>,
  ) {
    return this.pipelinesService.updateStage(pipelineId, stageId, dto);
  }

  @Delete('deal-pipelines/:id/stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal stage' })
  async removeStage(@Param('id') pipelineId: string, @Param('stageId') stageId: string) {
    await this.pipelinesService.removeStage(pipelineId, stageId);
  }

  // ─── Deals ──────────────────────────────────────────────────────────────────

  @Get('deals')
  @ApiOperation({ summary: 'List deals with filtering' })
  async findAll(@WorkspaceId() workspaceId: string, @Query() filter: DealFilterDto) {
    return this.dealsService.findAll(workspaceId, filter);
  }

  @Get('deals/kanban')
  @ApiOperation({ summary: 'Get deals in Kanban view' })
  async getKanban(@WorkspaceId() workspaceId: string, @Query('pipelineId') pipelineId?: string) {
    return this.dealsService.getKanban(workspaceId, pipelineId);
  }

  @Get('deals/forecast')
  @ApiOperation({ summary: 'Get revenue forecast' })
  async getForecast(@WorkspaceId() workspaceId: string, @Query('pipelineId') pipelineId?: string) {
    return this.forecastService.getForecast(workspaceId, pipelineId);
  }

  @Post('deals')
  @ApiOperation({ summary: 'Create a deal' })
  async create(
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateDealDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dealsService.create(workspaceId, dto, user.id);
  }

  @Get('deals/:id')
  @ApiOperation({ summary: 'Get deal detail' })
  async findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.dealsService.findById(workspaceId, id);
  }

  @Patch('deals/:id')
  @ApiOperation({ summary: 'Update a deal' })
  async update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<UpdateDealDto>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dealsService.update(workspaceId, id, dto, user.id);
  }

  @Delete('deals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal' })
  async remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.dealsService.remove(workspaceId, id);
  }

  @Post('deals/:id/won')
  @ApiOperation({ summary: 'Mark deal as won' })
  async markWon(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: MarkDealWonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dealsService.markWon(workspaceId, id, dto, user.id);
  }

  @Post('deals/:id/lost')
  @ApiOperation({ summary: 'Mark deal as lost' })
  async markLost(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: MarkDealLostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dealsService.markLost(workspaceId, id, dto, user.id);
  }

  @Get('deals/:id/history')
  @ApiOperation({ summary: 'Get deal history' })
  async getHistory(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.dealsService.getHistory(workspaceId, id);
  }

  @Post('deals/:id/notes')
  @ApiOperation({ summary: 'Add note to deal' })
  async addNote(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateDealNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dealsService.addNote(workspaceId, id, dto, user.id);
  }

  @Get('deals/:id/notes')
  @ApiOperation({ summary: 'Get deal notes' })
  async getNotes(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.dealsService.getNotes(workspaceId, id);
  }
}
