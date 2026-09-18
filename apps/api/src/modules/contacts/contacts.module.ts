import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsMergeService } from './contacts-merge.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactsExportService } from './contacts-export.service';
import { TimelineService } from './timeline.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    BullModule.registerQueue({ name: 'csv-import' }),
  ],
  controllers: [ContactsController],
  providers: [
    ContactsService,
    ContactsMergeService,
    ContactsImportService,
    ContactsExportService,
    TimelineService,
  ],
  exports: [ContactsService, TimelineService],
})
export class ContactsModule {}
