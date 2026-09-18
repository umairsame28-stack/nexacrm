import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealPipelinesService } from './deal-pipelines.service';
import { DealForecastService } from './deal-forecast.service';

@Module({
  controllers: [DealsController],
  providers: [DealsService, DealPipelinesService, DealForecastService],
  exports: [DealsService, DealForecastService],
})
export class DealsModule {}
