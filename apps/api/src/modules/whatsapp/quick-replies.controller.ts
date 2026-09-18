import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuickRepliesService } from './services/quick-replies.service';
import { CreateQuickReplyDto, UpdateQuickReplyDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('WhatsApp — Quick Replies')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Get()
  @ApiOperation({ summary: 'List quick replies' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.quickRepliesService.findAll(user.workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a quick reply snippet' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuickReplyDto) {
    return this.quickRepliesService.create(user.workspaceId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quick reply' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuickReplyDto,
  ) {
    return this.quickRepliesService.update(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quick reply' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.quickRepliesService.remove(user.workspaceId, id);
  }
}
