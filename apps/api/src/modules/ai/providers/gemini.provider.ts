import axios from 'axios';
import type { IAIProvider, AIPrompt, AIResponse } from './ai-provider.interface';

export class GeminiProvider implements IAIProvider {
  readonly providerName = 'GEMINI';
  readonly defaultModel: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.defaultModel = model ?? 'gemini-1.5-flash';
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const modelId = this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;

    // Build Gemini content format
    const contents = prompt.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await axios.post(
      url,
      {
        system_instruction: { parts: [{ text: prompt.system }] },
        contents,
        generationConfig: {
          maxOutputTokens: prompt.maxTokens ?? 1024,
          temperature: prompt.temperature ?? 0.7,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30_000,
      },
    );

    const candidate = response.data.candidates[0];
    const text = candidate.content.parts[0].text as string;
    const usage = response.data.usageMetadata;

    return {
      content: text,
      promptTokens: usage?.promptTokenCount as number ?? 0,
      completionTokens: usage?.candidatesTokenCount as number ?? 0,
      totalTokens: usage?.totalTokenCount as number ?? 0,
      model: this.defaultModel,
    };
  }
}
