import { Module } from '@nestjs/common';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminWorkspacesController } from './controllers/admin-workspaces.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminUsersService } from './services/admin-users.service';
import { AdminWorkspacesService } from './services/admin-workspaces.service';
import { AdminSystemService } from './services/admin-system.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminUsersController,
    AdminWorkspacesController,
    AdminSystemController,
  ],
  providers: [
    AdminUsersService,
    AdminWorkspacesService,
    AdminSystemService,
  ],
  exports: [
    AdminUsersService,
    AdminWorkspacesService,
    AdminSystemService,
  ],
})
export class AdminModule {}
