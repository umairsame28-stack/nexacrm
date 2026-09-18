import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { MetaWhatsAppAdapter } from '../adapters/meta-whatsapp.adapter';
import { ConversationsService } from './conversations.service';
import { SendMessageDto, ScheduleMessageDto, InternalNoteDto } from '../dto/whatsapp.dto';
import { CryptoService } from '../../../common/utils/crypto.service';
import { buildPaginatedResult, cursorToId } from '../../../common/utils/pagination.util';
import { AppGateway } from '../../../websocket/app.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
    private readonly conversationsService: ConversationsService,
    private readonly gateway: AppGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly crypto: CryptoService,
    @InjectQueue('message-scheduler') private readonly schedulerQueue: Queue,
  ) {}

  async getMessages(
    workspaceId: string,
    conversationId: string,
    opts: { limit?: number; cursor?: string },
  ) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const limit = Math.min(opts.limit ?? 50, 100);
    const cursorId = cursorToId(opts.cursor);

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isInternal: false },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          replyTo: { select: { id: true, body: true, type: true, direction: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.message.count({ where: { conversationId, isInternal: false } }),
    ]);

    return buildPaginatedResult(messages, limit, total);
  }

  async send(
    workspaceId: string,
    conversationId: string,
    dto: SendMessageDto,
    senderId: string,
  ) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
      include: { contact: { select: { phone: true } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.wabPhoneNumberId || !settings.wabAccessToken) {
      throw new UnprocessableEntityException('WhatsApp is not configured for this workspace');
    }

    const accessToken = this.crypto.decrypt(settings.wabAccessToken);
    const phoneNumberId = settings.wabPhoneNumberId;
    const toPhone = conv.contact.phone;

    // Persist the message first (optimistic)
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        workspaceId,
        senderId,
        direction: 'OUTBOUND',
        type: dto.type,
        status: 'PENDING',
        body: dto.body,
        templateName: dto.templateName,
        templateVars: dto.templateVars,
        replyToId: dto.replyToId,
        mediaUrl: dto.mediaKey,
      },
    });

    try {
      let result: { messageId: string };

      if (dto.type === 'TEXT') {
        if (!dto.body) throw new BadRequestException('body is required for text messages');
        result = await this.metaAdapter.sendText(phoneNumberId, accessToken, {
          to: toPhone,
          body: dto.body,
        });
      } else if (dto.type === 'TEMPLATE') {
        if (!dto.templateName) throw new BadRequestException('templateName is required');
        result = await this.metaAdapter.sendTemplate(phoneNumberId, accessToken, {
          to: toPhone,
          templateName: dto.templateName,
          languageCode: 'en',
          components: dto.templateVars
            ? [
                {
                  type: 'body',
                  parameters: Object.values(dto.templateVars).map((v) => ({
                    type: 'text' as const,
                    text: v,
                  })),
                },
              ]
            : [],
        });
      } else {
        // Media message
        const mediaType = dto.type.toLowerCase() as 'image' | 'audio' | 'video' | 'document';
        if (!dto.mediaKey) throw new BadRequestException('mediaKey is required for media messages');
        result = await this.metaAdapter.sendMedia(phoneNumberId, accessToken, {
          to: toPhone,
          type: mediaType,
          mediaUrl: dto.mediaKey,
          caption: dto.mediaCaption,
        });
      }

      // Update with Meta's message ID
      const updated = await this.prisma.message.update({
        where: { id: message.id },
        data: {
          whatsappMsgId: result.messageId,
          status: 'SENT',
          sentAt: new Date(),
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update conversation preview
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: dto.body ?? `[${dto.type}]`,
          status: 'OPEN',
        },
      });

      this.gateway.emitToConversation(conversationId, 'message:new', updated);
      this.gateway.emitToWorkspace(workspaceId, 'message:new', updated);

      return updated;
    } catch (error) {
      
      // Extract detailed error info
      let errorMessage = String(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        errorMessage = JSON.stringify(axiosError.response?.data) || axiosError.message || String(error);
      }
      
      // Mark as failed
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED', failureReason: errorMessage.substring(0, 500) },
      });
      
      throw error;
    }
  }

  async schedule(
    workspaceId: string,
    conversationId: string,
    dto: ScheduleMessageDto,
    senderId: string,
  ) {
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        workspaceId,
        senderId,
        direction: 'OUTBOUND',
        type: dto.type,
        status: 'SCHEDULED',
        body: dto.body,
        templateName: dto.templateName,
        templateVars: dto.templateVars,
        scheduledAt,
      },
    });

    const delay = scheduledAt.getTime() - Date.now();
    await this.schedulerQueue.add(
      'send-scheduled',
      { messageId: message.id, workspaceId, conversationId },
      { delay, attempts: 3 },
    );

    return message;
  }

  async cancelScheduled(workspaceId: string, conversationId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId, workspaceId, status: 'SCHEDULED' },
    });
    if (!message) throw new NotFoundException('Scheduled message not found');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'FAILED', failureReason: 'Cancelled by user' },
    });
  }

  async addInternalNote(
    workspaceId: string,
    conversationId: string,
    dto: InternalNoteDto,
    authorId: string,
  ) {
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    return this.prisma.internalNote.create({
      data: { conversationId, authorId, content: dto.content },
    });
  }

  async getInternalNotes(workspaceId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    return this.prisma.internalNote.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMessageStatus(
    workspaceId: string,
    whatsappMsgId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
    timestamp?: string,
    errorCode?: string,
  ) {
    const statusMap = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    } as const;

    const ts = timestamp ? new Date(parseInt(timestamp, 10) * 1000) : new Date();
    const updateData: Record<string, unknown> = { status: statusMap[status] };

    if (status === 'delivered') updateData.deliveredAt = ts;
    if (status === 'read') updateData.readAt = ts;
    if (status === 'failed') updateData.failureReason = errorCode ?? 'Unknown';

    const updated = await this.prisma.message.updateMany({
      where: { whatsappMsgId },
      data: updateData,
    });

    if (updated.count > 0) {
      const msg = await this.prisma.message.findFirst({ where: { whatsappMsgId } });
      if (msg) {
        this.gateway.emitToConversation(msg.conversationId, 'message:status', {
          id: msg.id,
          status: statusMap[status],
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
        });
      }
    }
  }
}
