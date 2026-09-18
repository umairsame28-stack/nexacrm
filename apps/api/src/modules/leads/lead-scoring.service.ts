import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ScoringFactors {
  hasEmail: boolean;
  hasCompany: boolean;
  messageCount: number;
  source: string;
  stage: string;
  daysSinceCreated: number;
}

@Injectable()
export class LeadScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-calculates a lead score based on available contact data and activity.
   */
  async calculateScore(leadId: string): Promise<number> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: {
          include: {
            conversations: {
              include: { _count: { select: { messages: true } } },
            },
          },
        },
        stage: true,
      },
    });

    if (!lead) return 0;

    const contact = lead.contact;
    const totalMessages = contact.conversations.reduce(
      (sum, c) => sum + c._count.messages,
      0,
    );
    const daysSinceCreated = Math.floor(
      (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const factors: ScoringFactors = {
      hasEmail: !!contact.email,
      hasCompany: !!contact.company,
      messageCount: totalMessages,
      source: lead.source,
      stage: lead.stage.name,
      daysSinceCreated,
    };

    return this.computeScore(factors);
  }

  private computeScore(factors: ScoringFactors): number {
    let score = 0;

    // Basic profile completeness
    if (factors.hasEmail) score += 10;
    if (factors.hasCompany) score += 10;

    // Engagement from messages
    score += Math.min(factors.messageCount * 3, 30);

    // Source bonus
    const sourceBonuses: Record<string, number> = {
      WHATSAPP: 15,
      WEB_FORM: 20,
      REFERRAL: 25,
      EMAIL: 10,
      MANUAL: 5,
    };
    score += sourceBonuses[factors.source] ?? 5;

    // Recency penalty — leads older than 30 days lose points
    if (factors.daysSinceCreated > 30) score -= 10;
    if (factors.daysSinceCreated > 60) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  async updateLeadScore(leadId: string): Promise<number> {
    const score = await this.calculateScore(leadId);
    await this.prisma.lead.update({ where: { id: leadId }, data: { score } });
    return score;
  }
}
