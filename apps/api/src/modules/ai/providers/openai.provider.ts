import { Logger } from '@nestjs/common';
import axios from 'axios';
import type { IAIProvider, AIPrompt, AIResponse, AIEmbeddingResponse } from './ai-provider.interface';

export class OpenAIProvider implements IAIProvider {
  readonly providerName = 'OPENAI';
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly logger = new Logger(OpenAIProvider.name);

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.defaultModel = model ?? 'gpt-4o';
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: prompt.system },
          ...prompt.messages,
        ],
        max_tokens: prompt.maxTokens ?? 1024,
        temperature: prompt.temperature ?? 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      },
    );

    const choice = response.data.choices[0];
    const usage = response.data.usage;

    return {
      content: choice.message.content as string,
      promptTokens: usage.prompt_tokens as number,
      completionTokens: usage.completion_tokens as number,
      totalTokens: usage.total_tokens as number,
      model: this.defaultModel,
    };
  }

  async embed(text: string): Promise<AIEmbeddingResponse> {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: text,
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 15_000,
      },
    );

    return {
      embedding: response.data.data[0].embedding as number[],
      totalTokens: response.data.usage.total_tokens as number,
    };
  }
}
