import type { AIPrompt } from '../providers/ai-provider.interface';

interface Message {
  direction: string;
  body?: string | null;
}

interface Lead {
  title: string;
  score: number;
  source: string;
}

interface Contact {
  firstName: string;
  company?: string | null;
  jobTitle?: string | null;
}

export function buildQualifyLeadPrompt(
  messages: Message[],
  lead: Lead,
  contact: Contact,
): AIPrompt {
  const history = messages
    .filter((m) => m.body)
    .slice(-20)
    .map((m) => `[${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}]: ${m.body}`)
    .join('\n');

  return {
    system: `You are an expert sales qualification analyst.
Analyze the lead and conversation to determine qualification.
Return ONLY valid JSON:
{
  "qualification": "HOT" | "WARM" | "COLD",
  "score": <integer 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "suggestedNextAction": "<specific actionable next step>"
}`,
    messages: [
      {
        role: 'user',
        content: `Lead: ${lead.title}
Contact: ${contact.firstName}${contact.company ? ` at ${contact.company}` : ''}${contact.jobTitle ? `, ${contact.jobTitle}` : ''}
Source: ${lead.source}
Current Score: ${lead.score}

Conversation:
${history || 'No conversation history available.'}

Qualify this lead:`,
      },
    ],
    maxTokens: 512,
    temperature: 0.3,
  };
}
