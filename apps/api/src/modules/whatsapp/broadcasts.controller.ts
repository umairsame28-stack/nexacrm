import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BroadcastService } from './services/broadcast.service';
import { CreateBroadcastDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('WhatsApp — Broadcasts')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Get()
  @ApiOperation({ summary: 'List broadcasts' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.broadcastService.findAll(user.workspaceId, { limit, cursor });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a broadcast' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBroadcastDto) {
    return this.broadcastService.create(user.workspaceId, dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broadcast by ID' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.broadcastService.findById(user.workspaceId, id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Immediately dispatch a broadcast' })
  send(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.broadcastService.send(user.workspaceId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Cancel a scheduled broadcast' })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.broadcastService.cancel(user.workspaceId, id);
  }
}
