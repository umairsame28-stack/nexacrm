import type { AIPrompt } from '../providers/ai-provider.interface';

export function buildRewritePrompt(text: string, tone: 'professional' | 'friendly' | 'formal'): AIPrompt {
  const toneGuide = {
    professional: 'professional and clear, suitable for business communication',
    friendly: 'warm, friendly, and approachable while remaining helpful',
    formal: 'formal and polished, suitable for official correspondence',
  };

  return {
    system: `You are an expert writing assistant. Rewrite the provided text to be ${toneGuide[tone]}.
Rules:
- Preserve the core meaning and intent
- Fix grammar, spelling, and punctuation
- Return ONLY the rewritten text, no explanations or quotes`,
    messages: [
      {
        role: 'user',
        content: `Rewrite this message:\n"${text}"`,
      },
    ],
    maxTokens: 512,
    temperature: 0.5,
  };
}

export function buildGrammarPrompt(text: string): AIPrompt {
  return {
    system: `You are a grammar correction assistant.
Correct only grammar, spelling, and punctuation errors.
Do NOT change the meaning, style, or intent.
Return ONLY the corrected text, nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Correct this text:\n"${text}"`,
      },
    ],
    maxTokens: 512,
    temperature: 0.1,
  };
}
