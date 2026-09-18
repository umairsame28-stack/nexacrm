import type { AIPrompt } from '../providers/ai-provider.interface';

interface Message {
  direction: string;
  body?: string | null;
  type: string;
  createdAt: Date;
}

interface Contact {
  firstName: string;
  lastName?: string | null;
}

export function buildSuggestReplyPrompt(
  messages: Message[],
  contact: Contact,
  agentName?: string,
): AIPrompt {
  // Take last 15 messages for context
  const recentMessages = messages.slice(-15);

  const conversationHistory = recentMessages
    .filter((m) => m.body)
    .map((m) => `[${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}]: ${m.body}`)
    .join('\n');

  return {
    system: `You are an expert customer support assistant helping ${agentName ?? 'an agent'} reply to ${contact.firstName} ${contact.lastName ?? ''}.
Your task: suggest 3 distinct professional, empathetic reply options.
Rules:
- Each reply should be concise (1-3 sentences max)
- Maintain a warm, professional tone
- Address the customer's most recent message
- Return ONLY a JSON array of 3 strings, no other text
Example: ["Reply 1 here.", "Reply 2 here.", "Reply 3 here."]`,
    messages: [
      {
        role: 'user',
        content: `Conversation history:\n${conversationHistory}\n\nGenerate 3 reply suggestions:`,
      },
    ],
    maxTokens: 512,
    temperature: 0.8,
  };
}
