import axios from 'axios';
import type { IAIProvider, AIPrompt, AIResponse } from './ai-provider.interface';

export class AnthropicProvider implements IAIProvider {
  readonly providerName = 'ANTHROPIC';
  readonly defaultModel: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.defaultModel = model ?? 'claude-3-5-sonnet-20241022';
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.defaultModel,
        system: prompt.system,
        messages: prompt.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: prompt.maxTokens ?? 1024,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      },
    );

    const content = response.data.content[0].text as string;
    const usage = response.data.usage;

    return {
      content,
      promptTokens: usage.input_tokens as number,
      completionTokens: usage.output_tokens as number,
      totalTokens: (usage.input_tokens + usage.output_tokens) as number,
      model: this.defaultModel,
    };
  }
}
