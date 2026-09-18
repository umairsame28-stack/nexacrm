import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PipelinesService } from './pipelines.service';
import { PipelineStagesService } from './pipeline-stages.service';
import { LeadScoringService } from './lead-scoring.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, PipelinesService, PipelineStagesService, LeadScoringService],
  exports: [LeadsService, PipelinesService, LeadScoringService],
})
export class LeadsModule {}
