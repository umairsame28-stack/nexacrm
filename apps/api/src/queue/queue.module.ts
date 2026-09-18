import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

// Processors
import { NotificationProcessor } from './processors/notification.processor';
import { MessageSchedulerProcessor } from './processors/message-scheduler.processor';
import { BroadcastProcessor } from './processors/broadcast.processor';
import { CsvImportProcessor } from './processors/csv-import.processor';

// Adapters needed by processors
import { MetaWhatsAppAdapter } from '../modules/whatsapp/adapters/meta-whatsapp.adapter';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'message-scheduler' },
      { name: 'broadcast' },
      { name: 'csv-import' },
      { name: 'ai-analysis' },
      { name: 'report-generation' },
    ),
    PrismaModule,
    WebsocketModule,
    NotificationsModule,
  ],
  providers: [
    MetaWhatsAppAdapter,
    NotificationProcessor,
    MessageSchedulerProcessor,
    BroadcastProcessor,
    CsvImportProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
