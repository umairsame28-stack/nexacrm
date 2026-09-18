import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConversationsService } from './services/conversations.service';
import {
  ConversationFilterDto,
  UpdateConversationDto,
  AddLabelDto,
} from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('WhatsApp — Conversations')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations (inbox)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() filter: ConversationFilterDto) {
    return this.conversationsService.findAll(user.workspaceId, filter);
  }

  @Post('by-contact/:contactId')
  @ApiOperation({ summary: 'Get or create conversation for a contact' })
  async getOrCreateForContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contactId') contactId: string,
  ) {
    // Get WhatsApp phone number ID from settings
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId: user.workspaceId },
      select: { wabPhoneNumberId: true },
    });

    if (!settings?.wabPhoneNumberId) {
      throw new UnprocessableEntityException('WhatsApp is not configured for this workspace');
    }

    // Verify contact exists and belongs to workspace
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId: user.workspaceId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Get or create conversation
    const conversation = await this.conversationsService.upsertForContact(
      user.workspaceId,
      contactId,
      settings.wabPhoneNumberId,
    );

    // Return with full details
    return this.conversationsService.findById(user.workspaceId, conversation.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation detail' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.conversationsService.findById(user.workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation status, assignment, or pin' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(user.workspaceId, id, dto);
  }

  @Post(':id/labels')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a label to a conversation' })
  addLabel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddLabelDto,
  ) {
    return this.conversationsService.addLabel(user.workspaceId, id, dto);
  }

  @Delete(':id/labels/:labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a label from a conversation' })
  removeLabel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('labelId') labelId: string,
  ) {
    return this.conversationsService.removeLabel(user.workspaceId, id, labelId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.conversationsService.markAsRead(user.workspaceId, id);
  }
}
