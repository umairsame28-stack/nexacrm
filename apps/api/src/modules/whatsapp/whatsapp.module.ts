import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketModule } from '../../websocket/websocket.module';

// Adapters
import { MetaWhatsAppAdapter } from './adapters/meta-whatsapp.adapter';

// Services
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { TemplatesService } from './services/templates.service';
import { QuickRepliesService } from './services/quick-replies.service';
import { BroadcastService } from './services/broadcast.service';

// Controllers
import { WebhookController } from './webhook.controller';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { TemplatesController } from './templates.controller';
import { BroadcastsController } from './broadcasts.controller';
import { QuickRepliesController } from './quick-replies.controller';

@Module({
  imports: [
    PrismaModule,
    WebsocketModule,
    BullModule.registerQueue(
      { name: 'message-scheduler' },
      { name: 'broadcast' },
    ),
  ],
  controllers: [
    WebhookController,
    ConversationsController,
    MessagesController,
    TemplatesController,
    BroadcastsController,
    QuickRepliesController,
  ],
  providers: [
    MetaWhatsAppAdapter,
    ConversationsService,
    MessagesService,
    WebhookProcessorService,
    TemplatesService,
    QuickRepliesService,
    BroadcastService,
  ],
  exports: [
    MetaWhatsAppAdapter,
    ConversationsService,
    MessagesService,
    WebhookProcessorService,
  ],
})
export class WhatsappModule {}
