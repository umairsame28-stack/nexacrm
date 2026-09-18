import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConversationsService } from './conversations.service';
import { AppGateway } from '../../../websocket/app.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CryptoService } from '../../../common/utils/crypto.service';
import { normalizePhone } from '../../../common/utils/phone.util';

interface MetaWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; mime_type: string; filename: string; caption?: string };
  sticker?: { id: string; mime_type: string; animated: boolean };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  context?: { from: string; id: string };
}

interface MetaWebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
    private readonly gateway: AppGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly crypto: CryptoService,
  ) {}

  async processWebhook(payload: Record<string, unknown>): Promise<void> {
    this.logger.log('🔄 Starting webhook processing...');
    
    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    if (!entry) {
      this.logger.warn('⚠️ No entry found in webhook payload');
      return;
    }

    const changes = (entry.changes as unknown[])?.[0] as Record<string, unknown>;
    if (!changes) {
      this.logger.warn('⚠️ No changes found in webhook entry');
      return;
    }

    const value = changes.value as Record<string, unknown>;
    if (!value) {
      this.logger.warn('⚠️ No value found in webhook changes');
      return;
    }

    const phoneNumberId = value.metadata
      ? (value.metadata as Record<string, string>).phone_number_id
      : undefined;

    if (!phoneNumberId) {
      this.logger.warn('⚠️ No phone_number_id found in webhook metadata');
      return;
    }

    this.logger.log(`📞 Phone Number ID: ${phoneNumberId}`);

    const settings = await this.prisma.workspaceSettings.findFirst({
      where: { wabPhoneNumberId: phoneNumberId },
    });
    if (!settings) {
      this.logger.error(`❌ No workspace found for phone number ID: ${phoneNumberId}`);
      this.logger.error('💡 Make sure you have saved your WhatsApp credentials with this Phone Number ID');
      return;
    }

    this.logger.log(`✅ Found workspace: ${settings.workspaceId}`);

    const messages = value.messages as MetaWebhookMessage[] | undefined;
    if (messages?.length) {
      this.logger.log(`📨 Processing ${messages.length} inbound message(s)...`);
      for (const msg of messages) {
        await this.processInboundMessage(settings.workspaceId, phoneNumberId, msg).catch((err) => {
          this.logger.error(`❌ Error processing message ${msg.id}: ${String(err)}`);
        });
      }
    }

    const statuses = value.statuses as MetaWebhookStatus[] | undefined;
    if (statuses?.length) {
      this.logger.log(`📊 Processing ${statuses.length} status update(s)...`);
      for (const status of statuses) {
        await this.processStatusUpdate(settings.workspaceId, status).catch((err) => {
          this.logger.error(`❌ Error processing status update ${status.id}: ${String(err)}`);
        });
      }
    }

    if (!messages?.length && !statuses?.length) {
      this.logger.warn('⚠️ Webhook contained no messages or statuses to process');
    }
  }

  private async processInboundMessage(
    workspaceId: string,
    phoneNumberId: string,
    msg: MetaWebhookMessage,
  ): Promise<void> {
    this.logger.log(`📩 Processing message ${msg.id} from ${msg.from}`);
    
    const existing = await this.prisma.message.findUnique({ where: { whatsappMsgId: msg.id } });
    if (existing) {
      this.logger.debug(`⏭️ Duplicate message ignored: ${msg.id}`);
      return;
    }

    const phone = normalizePhone(msg.from);
    if (!phone) {
      this.logger.warn(`⚠️ Invalid phone number from Meta: ${msg.from}`);
      return;
    }

    this.logger.log(`👤 Creating/updating contact for phone: ${phone}`);
    const contact = await this.prisma.contact.upsert({
      where: { workspaceId_phone: { workspaceId, phone } },
      create: { workspaceId, phone, firstName: phone, source: 'WHATSAPP' },
      update: {},
    });
    this.logger.log(`✅ Contact ID: ${contact.id}`);

    this.logger.log(`💬 Creating/updating conversation...`);
    const conversation = await this.conversationsService.upsertForContact(
      workspaceId,
      contact.id,
      phoneNumberId,
    );
    this.logger.log(`✅ Conversation ID: ${conversation.id}`);

    const { type, body, mediaUrl, mediaMimeType, mediaCaption, mediaFileName } =
      this.extractMessageContent(msg);

    // Serialize the raw webhook message as a plain JSON-safe object for Prisma
    const metadata: Prisma.InputJsonValue = { raw: msg as unknown as Prisma.InputJsonValue };

    this.logger.log(`💾 Saving message to database (type: ${type})...`);
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        workspaceId,
        direction: 'INBOUND',
        type,
        status: 'DELIVERED',
        body,
        mediaUrl,
        mediaMimeType,
        mediaCaption,
        mediaFileName,
        whatsappMsgId: msg.id,
        deliveredAt: new Date(parseInt(msg.timestamp, 10) * 1000),
        metadata,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    this.logger.log(`✅ Message saved with ID: ${message.id}`);

    this.logger.log(`🔄 Updating conversation metadata...`);
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        lastMessageText: body ?? `[${type}]`,
        unreadCount: { increment: 1 },
        status: 'OPEN',
      },
    });

    this.logger.log(`🔌 Emitting WebSocket event to workspace ${workspaceId}...`);
    this.gateway.emitToWorkspace(workspaceId, 'message:new', message);
    
    this.eventEmitter.emit('whatsapp.message_received', {
      workspaceId,
      contactId: contact.id,
      conversationId: conversation.id,
      messageId: message.id,
    });

    this.logger.log(`✅ ✅ ✅ Successfully processed inbound message from ${phone} → conversation ${conversation.id}`);
  }

  private extractMessageContent(msg: MetaWebhookMessage): {
    type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'STICKER' | 'LOCATION' | 'SYSTEM';
    body?: string;
    mediaUrl?: string;
    mediaMimeType?: string;
    mediaCaption?: string;
    mediaFileName?: string;
  } {
    switch (msg.type) {
      case 'text':
        return { type: 'TEXT', body: msg.text?.body };
      case 'image':
        return {
          type: 'IMAGE',
          mediaUrl: msg.image?.id,
          mediaMimeType: msg.image?.mime_type,
          mediaCaption: msg.image?.caption,
        };
      case 'audio':
        return { type: 'AUDIO', mediaUrl: msg.audio?.id, mediaMimeType: msg.audio?.mime_type };
      case 'video':
        return {
          type: 'VIDEO',
          mediaUrl: msg.video?.id,
          mediaMimeType: msg.video?.mime_type,
          mediaCaption: msg.video?.caption,
        };
      case 'document':
        return {
          type: 'DOCUMENT',
          mediaUrl: msg.document?.id,
          mediaMimeType: msg.document?.mime_type,
          mediaFileName: msg.document?.filename,
          mediaCaption: msg.document?.caption,
        };
      case 'sticker':
        return { type: 'STICKER', mediaUrl: msg.sticker?.id };
      case 'location':
        return {
          type: 'LOCATION',
          body: JSON.stringify({
            latitude: msg.location?.latitude,
            longitude: msg.location?.longitude,
            name: msg.location?.name,
            address: msg.location?.address,
          }),
        };
      default:
        return { type: 'SYSTEM', body: `Unsupported message type: ${msg.type}` };
    }
  }

  private async processStatusUpdate(
    workspaceId: string,
    status: MetaWebhookStatus,
  ): Promise<void> {
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    const ts = new Date(parseInt(status.timestamp, 10) * 1000);
    const updateData: Record<string, unknown> = { status: statusMap[status.status] };

    if (status.status === 'delivered') updateData.deliveredAt = ts;
    if (status.status === 'read') updateData.readAt = ts;
    if (status.status === 'failed') {
      updateData.failureReason = status.errors?.[0]?.title ?? 'Unknown error';
    }

    const updated = await this.prisma.message.updateMany({
      where: { whatsappMsgId: status.id },
      data: updateData,
    });

    if (updated.count > 0) {
      const msg = await this.prisma.message.findFirst({ where: { whatsappMsgId: status.id } });
      if (msg) {
        this.gateway.emitToConversation(msg.conversationId, 'message:status', {
          id: msg.id,
          status: statusMap[status.status],
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
        });
      }
    }
  }
}
