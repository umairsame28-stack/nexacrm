import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CryptoService } from '../../../common/utils/crypto.service';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import type { IAIProvider } from './ai-provider.interface';

@Injectable()
export class AIProviderFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async create(workspaceId: string): Promise<IAIProvider> {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: { aiProvider: true, aiApiKey: true, aiModel: true },
    });

    if (!settings?.aiProvider || !settings.aiApiKey) {
      throw new UnprocessableEntityException(
        'AI provider is not configured for this workspace. Please configure it in Settings → AI.',
      );
    }

    const apiKey = this.crypto.decrypt(settings.aiApiKey);
    const model = settings.aiModel ?? undefined;

    switch (settings.aiProvider) {
      case 'OPENAI':
        return new OpenAIProvider(apiKey, model);
      case 'ANTHROPIC':
        return new AnthropicProvider(apiKey, model);
      case 'GEMINI':
        return new GeminiProvider(apiKey, model);
      default:
        throw new UnprocessableEntityException(`Unsupported AI provider: ${settings.aiProvider}`);
    }
  }
}
