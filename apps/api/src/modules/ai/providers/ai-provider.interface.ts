export interface AIPrompt {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface AIEmbeddingResponse {
  embedding: number[];
  totalTokens: number;
}

export interface IAIProvider {
  complete(prompt: AIPrompt): Promise<AIResponse>;
  embed?(text: string): Promise<AIEmbeddingResponse>;
  readonly providerName: string;
  readonly defaultModel: string;
}
