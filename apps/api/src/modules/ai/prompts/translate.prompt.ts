import type { AIPrompt } from '../providers/ai-provider.interface';

export function buildTranslatePrompt(text: string, targetLanguage: string): AIPrompt {
  return {
    system: `You are a professional translator.
Translate the provided text to ${targetLanguage}.
Also detect the source language.
Return ONLY valid JSON:
{
  "translated": "<translated text>",
  "detectedLanguage": "<ISO 639-1 language code>"
}`,
    messages: [
      {
        role: 'user',
        content: `Translate:\n"${text}"`,
      },
    ],
    maxTokens: 1024,
    temperature: 0.2,
  };
}
