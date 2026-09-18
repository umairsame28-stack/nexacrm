import type { AIPrompt } from '../providers/ai-provider.interface';

interface Message {
  direction: string;
  body?: string | null;
}

export function buildSentimentPrompt(messages: Message[]): AIPrompt {
  const customerMessages = messages
    .filter((m) => m.direction === 'INBOUND' && m.body)
    .slice(-10)
    .map((m) => m.body)
    .join('\n');

  return {
    system: `You are a customer sentiment analysis expert.
Analyze the customer messages and determine their sentiment.
Return ONLY valid JSON:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "score": <number between -1.0 (very negative) and 1.0 (very positive)>,
  "emotions": ["<emotion1>", "<emotion2>"],
  "summary": "<1 sentence describing the customer's emotional state>"
}`,
    messages: [
      {
        role: 'user',
        content: `Customer messages:\n${customerMessages || 'No messages available.'}\n\nAnalyze sentiment:`,
      },
    ],
    maxTokens: 256,
    temperature: 0.2,
  };
}
