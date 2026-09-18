import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { EmailNotificationService } from '../../modules/notifications/email-notification.service';
import type { NotificationType } from '@prisma/client';

interface NotificationJobData {
  workspaceId: string;
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailNotificationService,
  ) {}

  @Process('send')
  async handleSendNotification(job: Job<NotificationJobData>): Promise<void> {
    const data = job.data;
    this.logger.debug(`Processing notification for user ${data.userId}`);

    // Create in-app notification
    await this.notificationsService.create({
      workspaceId: data.workspaceId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link,
      metadata: data.metadata,
    });

    // Check if email notification is enabled
    const emailEnabled = await this.notificationsService.isChannelEnabled(
      data.userId,
      data.workspaceId,
      data.type,
      'EMAIL',
    );

    if (emailEnabled && data.userEmail) {
      await this.emailService.sendEmail({
        to: data.userEmail,
        subject: data.title,
        html: `<div style="font-family:sans-serif"><h3>${data.title}</h3>${data.body ? `<p>${data.body}</p>` : ''}${data.link ? `<p><a href="${data.link}">View in NexaCRM</a></p>` : ''}</div>`,
        text: `${data.title}${data.body ? `\n\n${data.body}` : ''}`,
      });
    }
  }
}
