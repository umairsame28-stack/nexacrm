import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { MembersService } from './members.service';
import { InvitationsService } from './invitations.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, MembersService, InvitationsService],
  exports: [WorkspaceService, MembersService],
})
export class WorkspaceModule {}
