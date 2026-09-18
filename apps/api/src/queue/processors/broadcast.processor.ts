import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaWhatsAppAdapter } from '../../modules/whatsapp/adapters/meta-whatsapp.adapter';
import { CryptoService } from '../../common/utils/crypto.service';

interface BroadcastJob {
  broadcastId: string;
  workspaceId: string;
}

const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between batches

@Processor('broadcast')
export class BroadcastProcessor {
  private readonly logger = new Logger(BroadcastProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
    private readonly crypto: CryptoService,
  ) {}

  @Process('send-broadcast')
  async handleBroadcast(job: Job<BroadcastJob>): Promise<void> {
    const { broadcastId, workspaceId } = job.data;
    this.logger.log(`Starting broadcast ${broadcastId}`);

    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: broadcastId },
      include: {
        recipients: {
          where: { status: 'PENDING' },
          include: { broadcast: false },
        },
      },
    });

    if (!broadcast) {
      this.logger.warn(`Broadcast ${broadcastId} not found`);
      return;
    }

    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.wabPhoneNumberId || !settings.wabAccessToken) {
      await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: 'FAILED' } });
      throw new Error('WhatsApp not configured');
    }

    const accessToken = this.crypto.decrypt(settings.wabAccessToken);
    const phoneNumberId = settings.wabPhoneNumberId;

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'SENDING', startedAt: new Date() },
    });

    let sentCount = 0;
    let failedCount = 0;
    const recipients = broadcast.recipients;

    // Process in batches to respect rate limits
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (recipient) => {
          const contact = await this.prisma.contact.findUnique({
            where: { id: recipient.contactId },
            select: { phone: true, firstName: true },
          });

          if (!contact) {
            await this.prisma.broadcastRecipient.update({
              where: { id: recipient.id },
              data: { status: 'FAILED', failureReason: 'Contact not found' },
            });
            failedCount++;
            return;
          }

          try {
            let result: { messageId: string };

            if (broadcast.templateId) {
              const template = await this.prisma.messageTemplate.findUnique({
                where: { id: broadcast.templateId },
              });
              if (!template) throw new Error('Template not found');

              // Substitute variables
              const vars = broadcast.templateVars as Record<string, string> | null ?? {};
              const substitutedVars: Record<string, string> = {};
              for (const [k, v] of Object.entries(vars)) {
                substitutedVars[k] = v.replace('{{firstName}}', contact.firstName);
              }

              result = await this.metaAdapter.sendTemplate(phoneNumberId, accessToken, {
                to: contact.phone,
                templateName: template.name,
                languageCode: template.language,
                components: Object.keys(substitutedVars).length > 0
                  ? [{ type: 'body', parameters: Object.values(substitutedVars).map((v) => ({ type: 'text' as const, text: v })) }]
                  : [],
              });
            } else {
              throw new Error('No template specified for broadcast');
            }

            await this.prisma.broadcastRecipient.update({
              where: { id: recipient.id },
              data: { status: 'SENT', messageId: result.messageId, sentAt: new Date() },
            });
            sentCount++;
          } catch (error) {
            await this.prisma.broadcastRecipient.update({
              where: { id: recipient.id },
              data: { status: 'FAILED', failureReason: String(error) },
            });
            failedCount++;
            this.logger.warn(`Failed to send to ${contact.phone}: ${String(error)}`);
          }
        }),
      );

      // Update progress
      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: { sentCount, failedCount },
      });

      // Rate limiting between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
      }
    }

    const finalStatus =
      failedCount === recipients.length ? 'FAILED' : 'SENT';

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: finalStatus, sentCount, failedCount, completedAt: new Date() },
    });

    this.logger.log(
      `Broadcast ${broadcastId} complete: ${sentCount} sent, ${failedCount} failed`,
    );
  }
}
