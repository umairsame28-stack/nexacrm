import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import type { IAIProvider, AIPrompt, AIResponse } from './providers/ai-provider.interface';
import { buildSuggestReplyPrompt } from './prompts/suggest-reply.prompt';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { buildRewritePrompt, buildGrammarPrompt } from './prompts/rewrite.prompt';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { buildQualifyLeadPrompt } from './prompts/qualify-lead.prompt';
import { buildSentimentPrompt } from './prompts/sentiment.prompt';
import {
  buildFollowUpPrompt,
  buildSuggestTagsPrompt,
  buildInsightsPrompt,
} from './prompts/followup.prompt';
import type {
  SuggestReplyDto,
  SummarizeConversationDto,
  RewriteDto,
  CorrectGrammarDto,
  TranslateDto,
  QualifyLeadDto,
  SentimentAnalysisDto,
  SuggestTagsDto,
  GenerateFollowUpDto,
  AISearchDto,
  InsightsDto,
} from './dto/ai.dto';
import type { AIProvider } from '@prisma/client';

@Injectable()
export class AIFacadeService {
  private readonly logger = new Logger(AIFacadeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  // ─── Suggest Reply ────────────────────────────────────────────────────────

  async suggestReply(workspaceId: string, dto: SuggestReplyDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const [messages, conversation] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: dto.conversationId, isInternal: false },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, workspaceId },
        include: { contact: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    if (!conversation) throw new NotFoundException('Conversation not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    const prompt = buildSuggestReplyPrompt(
      messages.reverse(),
      conversation.contact,
      user?.firstName,
    );

    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'suggest_reply');

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(response.content) as string[];
      if (!Array.isArray(suggestions)) suggestions = [response.content];
    } catch {
      suggestions = [response.content];
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'suggest_reply', response, Date.now() - start);

    return { suggestions, model: response.model, tokensUsed: response.totalTokens };
  }

  // ─── Summarize Conversation ───────────────────────────────────────────────

  async summarizeConversation(workspaceId: string, dto: SummarizeConversationDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const [messages, conversation] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: dto.conversationId, workspaceId, isInternal: false },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, workspaceId },
        include: { contact: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    if (!conversation) throw new NotFoundException('Conversation not found');

    const contactName = `${conversation.contact.firstName} ${conversation.contact.lastName ?? ''}`.trim();
    const prompt = buildSummarizePrompt(messages, contactName);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'summarize');

    let result: { summary: string[]; sentiment: string; sentimentScore: number };
    try {
      result = JSON.parse(response.content) as typeof result;
    } catch {
      result = { summary: [response.content], sentiment: 'NEUTRAL', sentimentScore: 0 };
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'summarize', response, Date.now() - start);
    return result;
  }

  // ─── Rewrite ──────────────────────────────────────────────────────────────

  async rewrite(workspaceId: string, dto: RewriteDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);
    const prompt = buildRewritePrompt(dto.text, dto.tone ?? 'professional');
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'rewrite');
    await this.logUsage(workspaceId, userId, provider.providerName, 'rewrite', response, Date.now() - start);
    return { rewritten: response.content.trim() };
  }

  // ─── Grammar Correction ───────────────────────────────────────────────────

  async correctGrammar(workspaceId: string, dto: CorrectGrammarDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);
    const prompt = buildGrammarPrompt(dto.text);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'grammar');
    await this.logUsage(workspaceId, userId, provider.providerName, 'grammar', response, Date.now() - start);
    return { corrected: response.content.trim() };
  }

  // ─── Translate ────────────────────────────────────────────────────────────

  async translate(workspaceId: string, dto: TranslateDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);
    const prompt = buildTranslatePrompt(dto.text, dto.targetLanguage);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'translate');

    let result: { translated: string; detectedLanguage: string };
    try {
      result = JSON.parse(response.content) as typeof result;
    } catch {
      result = { translated: response.content, detectedLanguage: 'unknown' };
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'translate', response, Date.now() - start);
    return result;
  }

  // ─── Qualify Lead ─────────────────────────────────────────────────────────

  async qualifyLead(workspaceId: string, dto: QualifyLeadDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, workspaceId },
      include: {
        contact: {
          select: {
            firstName: true,
            company: true,
            jobTitle: true,
            conversations: {
              include: {
                messages: {
                  where: { isInternal: false },
                  orderBy: { createdAt: 'asc' },
                  take: 30,
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    const messages = lead.contact.conversations[0]?.messages ?? [];
    const prompt = buildQualifyLeadPrompt(messages, lead, lead.contact);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'qualify_lead');

    let result: { qualification: string; score: number; reasoning: string; suggestedNextAction: string };
    try {
      result = JSON.parse(response.content) as typeof result;
    } catch {
      result = {
        qualification: 'WARM',
        score: lead.score,
        reasoning: response.content,
        suggestedNextAction: 'Follow up with the customer',
      };
    }

    if (result.score !== lead.score) {
      await this.prisma.lead.update({ where: { id: dto.leadId }, data: { score: result.score } });
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'qualify_lead', response, Date.now() - start);
    return result;
  }

  // ─── Sentiment Analysis ───────────────────────────────────────────────────

  async analyzeSentiment(workspaceId: string, dto: SentimentAnalysisDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: dto.conversationId,
        workspaceId,
        direction: 'INBOUND',
        isInternal: false,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const prompt = buildSentimentPrompt(messages);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'sentiment');

    let result: { sentiment: string; score: number; emotions: string[]; summary: string };
    try {
      result = JSON.parse(response.content) as typeof result;
    } catch {
      result = { sentiment: 'NEUTRAL', score: 0, emotions: [], summary: response.content };
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'sentiment', response, Date.now() - start);
    return result;
  }

  // ─── Suggest Tags ─────────────────────────────────────────────────────────

  async suggestTags(workspaceId: string, dto: SuggestTagsDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, workspaceId },
      include: {
        tags: { include: { tag: { select: { name: true } } } },
        conversations: {
          include: {
            messages: {
              where: { isInternal: false },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
          take: 1,
        },
      },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    const existingTags = contact.tags.map((t) => t.tag.name);
    const messages = contact.conversations[0]?.messages ?? [];
    const summary = messages
      .filter((m) => m.body)
      .slice(0, 10)
      .map((m) => m.body)
      .join(' ');

    const prompt = buildSuggestTagsPrompt(
      contact.firstName,
      summary || 'No conversation available',
      existingTags,
    );
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'suggest_tags');

    let suggestedTags: string[] = [];
    try {
      suggestedTags = JSON.parse(response.content) as string[];
      if (!Array.isArray(suggestedTags)) suggestedTags = [];
    } catch {
      suggestedTags = [];
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'suggest_tags', response, Date.now() - start);
    return { suggestedTags };
  }

  // ─── Generate Follow-Up ───────────────────────────────────────────────────

  async generateFollowUp(workspaceId: string, dto: GenerateFollowUpDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const deal = await this.prisma.deal.findFirst({
      where: { id: dto.dealId, workspaceId },
      include: {
        stage: { select: { name: true } },
        contacts: { include: { contact: { select: { firstName: true } } }, take: 1 },
      },
    });

    if (!deal) throw new NotFoundException('Deal not found');

    const contactName = deal.contacts[0]?.contact.firstName ?? 'there';
    const prompt = buildFollowUpPrompt(contactName, deal.title, deal.stage.name, dto.context);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'generate_followup');

    await this.logUsage(workspaceId, userId, provider.providerName, 'generate_followup', response, Date.now() - start);
    return { message: response.content.trim() };
  }

  // ─── AI Search ────────────────────────────────────────────────────────────

  async search(workspaceId: string, dto: AISearchDto, _userId: string) {
    const query = dto.query.toLowerCase();
    const limit = Math.min(dto.limit ?? 10, 50);

    const [contacts, conversations, deals] = await Promise.all([
      this.prisma.contact.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, company: true, phone: true },
        take: Math.ceil(limit / 3),
      }),
      this.prisma.conversation.findMany({
        where: {
          workspaceId,
          OR: [
            { lastMessageText: { contains: query, mode: 'insensitive' } },
            { contact: { firstName: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: { contact: { select: { firstName: true, lastName: true } } },
        take: Math.ceil(limit / 3),
      }),
      this.prisma.deal.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          title: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, title: true, value: true, status: true },
        take: Math.ceil(limit / 3),
      }),
    ]);

    const results = [
      ...contacts.map((c) => ({
        type: 'contact',
        id: c.id,
        title: `${c.firstName} ${c.lastName ?? ''}`.trim(),
        subtitle: c.company ?? c.phone,
        relevanceScore: 0.9,
      })),
      ...conversations.map((c) => ({
        type: 'conversation',
        id: c.id,
        title: `${c.contact.firstName} ${c.contact.lastName ?? ''}`.trim(),
        subtitle: c.lastMessageText,
        relevanceScore: 0.8,
      })),
      ...deals.map((d) => ({
        type: 'deal',
        id: d.id,
        title: d.title,
        subtitle: `$${Number(d.value).toLocaleString()} — ${d.status}`,
        relevanceScore: 0.85,
      })),
    ].slice(0, limit);

    return { results };
  }

  // ─── Generate Insights ────────────────────────────────────────────────────

  async generateInsights(workspaceId: string, dto: InsightsDto, userId: string) {
    const start = Date.now();
    const provider = await this.providerFactory.create(workspaceId);

    const now = new Date();
    const period = dto.period ?? 'last_30_days';
    const daysBack = period === 'last_7_days' ? 7 : period === 'last_90_days' ? 90 : 30;
    const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const [contacts, dealsWon, dealsLost, messages, leads] = await Promise.all([
      this.prisma.contact.count({ where: { workspaceId, createdAt: { gte: since }, deletedAt: null } }),
      this.prisma.deal.aggregate({
        where: { workspaceId, status: 'WON', closedAt: { gte: since } },
        _count: { id: true },
        _sum: { value: true },
      }),
      this.prisma.deal.count({ where: { workspaceId, status: 'LOST', closedAt: { gte: since } } }),
      this.prisma.message.count({ where: { workspaceId, createdAt: { gte: since }, direction: 'INBOUND' } }),
      this.prisma.lead.count({ where: { workspaceId, createdAt: { gte: since }, deletedAt: null } }),
    ]);

    const metrics = {
      period,
      newContacts: contacts,
      dealsWon: dealsWon._count.id,
      revenueWon: Number(dealsWon._sum.value ?? 0),
      dealsLost,
      newLeads: leads,
      inboundMessages: messages,
      winRate:
        dealsWon._count.id + dealsLost > 0
          ? Math.round((dealsWon._count.id / (dealsWon._count.id + dealsLost)) * 100)
          : 0,
    };

    const prompt = buildInsightsPrompt(metrics, period);
    const response = await this.callWithCircuitBreaker(provider, prompt, workspaceId, userId, 'insights');

    let insights: string[] = [];
    try {
      insights = JSON.parse(response.content) as string[];
      if (!Array.isArray(insights)) insights = [response.content];
    } catch {
      insights = [response.content];
    }

    await this.logUsage(workspaceId, userId, provider.providerName, 'insights', response, Date.now() - start);
    return { insights };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async callWithCircuitBreaker(
    provider: IAIProvider,
    prompt: AIPrompt,
    workspaceId: string,
    userId: string,
    feature: string,
  ): Promise<AIResponse> {
    try {
      return await provider.complete(prompt);
    } catch (error) {
      this.logger.error(
        `AI provider ${provider.providerName} failed for ${feature}: ${String(error)}`,
      );
      await this.logUsage(workspaceId, userId, provider.providerName, feature, null, 0, String(error));
      throw new ServiceUnavailableException(
        'AI service is temporarily unavailable. Please try again shortly.',
      );
    }
  }

  private async logUsage(
    workspaceId: string,
    userId: string,
    providerName: string,
    feature: string,
    response: AIResponse | null,
    latencyMs: number,
    error?: string,
  ): Promise<void> {
    try {
      await this.prisma.aiUsageLog.create({
        data: {
          workspaceId,
          userId,
          provider: providerName as AIProvider,
          feature,
          model: response?.model ?? 'unknown',
          promptTokens: response?.promptTokens ?? 0,
          completionTokens: response?.completionTokens ?? 0,
          totalTokens: response?.totalTokens ?? 0,
          latencyMs,
          success: !error,
          error: error ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log AI usage: ${String(err)}`);
    }
  }
}
