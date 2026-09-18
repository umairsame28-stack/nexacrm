import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailNotificationService } from './email-notification.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailNotificationService],
  exports: [NotificationsService, EmailNotificationService],
})
export class NotificationsModule {}
