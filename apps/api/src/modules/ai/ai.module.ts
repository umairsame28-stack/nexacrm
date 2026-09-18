import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIFacadeService } from './ai-facade.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AIController],
  providers: [AIFacadeService, AIProviderFactory],
  exports: [AIFacadeService, AIProviderFactory],
})
export class AiModule {}
