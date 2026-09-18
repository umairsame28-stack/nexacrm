import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Get the Gemini Pro model
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Generate AI insights from text
 */
export async function generateInsights(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate insights');
  }
}

/**
 * Analyze lead quality and score
 */
export async function analyzeLeadQuality(leadData: {
  name: string;
  email?: string;
  phone?: string;
  messages?: string[];
  interactions?: number;
}): Promise<{
  score: number;
  reasoning: string;
  suggestions: string[];
}> {
  const prompt = `
You are a sales expert analyzing a lead. Based on the following information, provide:
1. A lead quality score from 0-100
2. Brief reasoning (2-3 sentences)
3. 3 actionable suggestions to convert this lead

Lead Information:
- Name: ${leadData.name}
- Email: ${leadData.email || 'Not provided'}
- Phone: ${leadData.phone || 'Not provided'}
- Number of interactions: ${leadData.interactions || 0}
- Recent messages: ${leadData.messages?.join(', ') || 'No messages'}

Respond in JSON format:
{
  "score": <number 0-100>,
  "reasoning": "<string>",
  "suggestions": ["<string>", "<string>", "<string>"]
}
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Lead analysis error:', error);
    return {
      score: 50,
      reasoning: 'Unable to analyze lead quality at this time.',
      suggestions: [
        'Follow up with a personalized message',
        'Schedule a call to understand their needs',
        'Send relevant product information'
      ]
    };
  }
}

/**
 * Generate email/message suggestions
 */
export async function generateMessageSuggestion(context: {
  contactName: string;
  previousMessages?: string[];
  purpose: 'follow-up' | 'introduction' | 'proposal' | 'closing';
}): Promise<string> {
  const purposeMap = {
    'follow-up': 'a friendly follow-up to check in',
    'introduction': 'an introduction to establish contact',
    'proposal': 'a business proposal or offer',
    'closing': 'closing the deal and asking for commitment'
  };

  const prompt = `
Write a professional WhatsApp message for ${purposeMap[context.purpose]}.

Context:
- Contact name: ${context.contactName}
- Previous conversation: ${context.previousMessages?.join('\n') || 'First contact'}

Requirements:
- Keep it under 150 words
- Professional but friendly tone
- Personalized and relevant
- Include a clear call-to-action
- Suitable for WhatsApp Business

Just provide the message text, no extra formatting or labels.
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Message generation error:', error);
    return `Hi ${context.contactName}, I wanted to reach out and connect with you. Let me know if you have any questions!`;
  }
}

/**
 * Analyze conversation sentiment
 */
export async function analyzeSentiment(messages: string[]): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  summary: string;
}> {
  const prompt = `
Analyze the sentiment of this conversation:

${messages.join('\n')}

Respond in JSON format:
{
  "sentiment": "<positive|neutral|negative>",
  "confidence": <number 0-100>,
  "summary": "<brief 1-sentence summary>"
}
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      confidence: 50,
      summary: 'Unable to analyze sentiment at this time.'
    };
  }
}

/**
 * Generate sales insights from dashboard data
 */
export async function generateDashboardInsights(data: {
  revenue: number;
  revenueChange: number;
  totalContacts: number;
  openLeads: number;
  conversionRate: number;
}): Promise<string[]> {
  const prompt = `
As a sales analytics expert, provide 3 actionable insights based on these metrics:

- Revenue this month: $${data.revenue}
- Revenue change: ${data.revenueChange > 0 ? '+' : ''}${data.revenueChange}%
- Total contacts: ${data.totalContacts}
- Open leads: ${data.openLeads}
- Conversion rate: ${data.conversionRate}%

Provide 3 brief, actionable insights (1-2 sentences each) that would help improve sales performance.
Format as JSON array: ["insight 1", "insight 2", "insight 3"]
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Dashboard insights error:', error);
    return [
      'Focus on converting your open leads to improve conversion rate.',
      'Your revenue is trending positively - maintain momentum with follow-ups.',
      'Consider segmenting your contacts for more targeted outreach.'
    ];
  }
}

/**
 * Suggest next best action for a contact
 */
export async function suggestNextAction(contact: {
  name: string;
  lastInteraction?: Date;
  status: string;
  messageCount: number;
}): Promise<string> {
  const daysSinceContact = contact.lastInteraction 
    ? Math.floor((Date.now() - new Date(contact.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const prompt = `
As a sales advisor, suggest the next best action for this contact:

- Name: ${contact.name}
- Status: ${contact.status}
- Days since last contact: ${daysSinceContact}
- Total messages exchanged: ${contact.messageCount}

Provide a single, specific action recommendation in 1 sentence.
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Next action suggestion error:', error);
    return 'Follow up with a personalized message to re-engage this contact.';
  }
}
