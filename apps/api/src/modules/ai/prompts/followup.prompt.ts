import type { AIPrompt } from '../providers/ai-provider.interface';

export function buildFollowUpPrompt(
  contactName: string,
  dealTitle: string,
  dealStage: string,
  context?: string,
): AIPrompt {
  return {
    system: `You are an expert sales copywriter. Write a personalized, professional follow-up message.
Rules:
- Warm, conversational tone — not pushy
- Maximum 3 sentences
- Include a clear, low-friction call-to-action
- Return ONLY the message text, no subject line or metadata`,
    messages: [
      {
        role: 'user',
        content: `Write a follow-up message for:
Contact: ${contactName}
Deal: ${dealTitle}
Stage: ${dealStage}
${context ? `Context: ${context}` : ''}`,
      },
    ],
    maxTokens: 256,
    temperature: 0.75,
  };
}

export function buildSuggestTagsPrompt(
  contactName: string,
  conversationSummary: string,
  existingTags: string[],
): AIPrompt {
  return {
    system: `You are a CRM data analyst. Suggest relevant tags for a contact based on their conversation.
Rules:
- Suggest 2-5 relevant tags
- Tags should be short (1-3 words), lowercase, hyphenated
- Do NOT suggest tags already in the existing list
- Return ONLY a JSON array of tag strings
Example: ["enterprise", "decision-maker", "high-value"]`,
    messages: [
      {
        role: 'user',
        content: `Contact: ${contactName}
Conversation summary: ${conversationSummary}
Existing tags: ${existingTags.join(', ') || 'none'}
Suggest new tags:`,
      },
    ],
    maxTokens: 128,
    temperature: 0.5,
  };
}

export function buildInsightsPrompt(metrics: Record<string, unknown>, period: string): AIPrompt {
  return {
    system: `You are a business intelligence analyst for a CRM platform.
Analyze the metrics and generate 3-5 actionable insights.
Rules:
- Each insight should be specific and data-driven
- Include both observations and recommendations
- Return ONLY a JSON array of insight strings
- Each insight should be 1-2 sentences`,
    messages: [
      {
        role: 'user',
        content: `CRM metrics for ${period}:\n${JSON.stringify(metrics, null, 2)}\n\nGenerate insights:`,
      },
    ],
    maxTokens: 512,
    temperature: 0.4,
  };
}
