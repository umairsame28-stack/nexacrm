import type { AIPrompt } from '../providers/ai-provider.interface';

interface Message {
  direction: string;
  body?: string | null;
  type: string;
}

export function buildSummarizePrompt(messages: Message[], contactName: string): AIPrompt {
  const history = messages
    .filter((m) => m.body)
    .map((m) => `[${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}]: ${m.body}`)
    .join('\n');

  return {
    system: `You are a CRM assistant. Summarize the conversation with ${contactName} in 3-5 concise bullet points.
Also determine the overall customer sentiment.
Return ONLY valid JSON in this exact format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": <number between -1.0 and 1.0>
}`,
    messages: [
      {
        role: 'user',
        content: `Conversation:\n${history}\n\nProvide summary and sentiment:`,
      },
    ],
    maxTokens: 512,
    temperature: 0.3,
  };
}
