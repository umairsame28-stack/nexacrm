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
import { MessagesService } from './services/messages.service';
import { SendMessageDto, ScheduleMessageDto, InternalNoteDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('WhatsApp — Messages')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('conversations/:conversationId')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.getMessages(user.workspaceId, conversationId, { limit, cursor });
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message (text, media, or template)' })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(user.workspaceId, conversationId, dto, user.id);
  }

  @Post('messages/schedule')
  @ApiOperation({ summary: 'Schedule a message for future delivery' })
  schedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: ScheduleMessageDto,
  ) {
    return this.messagesService.schedule(user.workspaceId, conversationId, dto, user.id);
  }

  @Delete('messages/:messageId/schedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a scheduled message' })
  cancelScheduled(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.cancelScheduled(user.workspaceId, conversationId, messageId);
  }

  @Post('internal-notes')
  @ApiOperation({ summary: 'Add an internal note (not visible to customer)' })
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: InternalNoteDto,
  ) {
    return this.messagesService.addInternalNote(user.workspaceId, conversationId, dto, user.id);
  }

  @Get('internal-notes')
  @ApiOperation({ summary: 'Get internal notes for a conversation' })
  getNotes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.getInternalNotes(user.workspaceId, conversationId);
  }
}
