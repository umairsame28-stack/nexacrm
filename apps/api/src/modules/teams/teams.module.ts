import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { DepartmentsService } from './departments.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, DepartmentsService],
  exports: [TeamsService, DepartmentsService],
})
export class TeamsModule {}
