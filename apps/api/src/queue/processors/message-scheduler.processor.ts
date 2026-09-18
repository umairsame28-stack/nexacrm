import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaWhatsAppAdapter } from '../../modules/whatsapp/adapters/meta-whatsapp.adapter';
import { CryptoService } from '../../common/utils/crypto.service';
import { AppGateway } from '../../websocket/app.gateway';

interface ScheduledMessageJob {
  messageId: string;
  workspaceId: string;
  conversationId: string;
}

@Processor('message-scheduler')
export class MessageSchedulerProcessor {
  private readonly logger = new Logger(MessageSchedulerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
    private readonly crypto: CryptoService,
    private readonly gateway: AppGateway,
  ) {}

  @Process('send-scheduled')
  async handleScheduledMessage(job: Job<ScheduledMessageJob>): Promise<void> {
    const { messageId, workspaceId, conversationId } = job.data;
    this.logger.log(`Processing scheduled message ${messageId}`);

    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.status !== 'SCHEDULED') {
      this.logger.warn(`Scheduled message ${messageId} is no longer scheduled`);
      return;
    }

    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.wabPhoneNumberId || !settings.wabAccessToken) {
      throw new Error('WhatsApp not configured');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: { select: { phone: true } } },
    });
    if (!conversation) throw new Error('Conversation not found');

    const accessToken = this.crypto.decrypt(settings.wabAccessToken);
    const phoneNumberId = settings.wabPhoneNumberId;
    const toPhone = conversation.contact.phone;

    try {
      let result: { messageId: string };

      if (message.type === 'TEXT' && message.body) {
        result = await this.metaAdapter.sendText(phoneNumberId, accessToken, {
          to: toPhone,
          body: message.body,
        });
      } else if (message.type === 'TEMPLATE' && message.templateName) {
        result = await this.metaAdapter.sendTemplate(phoneNumberId, accessToken, {
          to: toPhone,
          templateName: message.templateName,
          languageCode: 'en',
        });
      } else {
        throw new Error(`Unsupported scheduled message type: ${message.type}`);
      }

      const updated = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          whatsappMsgId: result.messageId,
          sentAt: new Date(),
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), lastMessageText: message.body ?? `[${message.type}]` },
      });

      this.gateway.emitToConversation(conversationId, 'message:new', updated);
      this.logger.log(`Scheduled message ${messageId} sent successfully`);
    } catch (error) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', failureReason: String(error) },
      });
      throw error;
    }
  }
}
