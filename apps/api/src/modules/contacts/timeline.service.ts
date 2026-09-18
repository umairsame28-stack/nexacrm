import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(
    workspaceId: string,
    contactId: string,
    opts: { limit?: number; cursor?: string },
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const limit = opts.limit ?? 25;
    const cursorId = cursorToId(opts.cursor);

    const events = await this.prisma.contactTimelineEvent.findMany({
      where: { contactId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
    });

    return buildPaginatedResult(events, limit);
  }

  async recordEvent(
    contactId: string,
    workspaceId: string,
    eventType: string,
    title: string,
    opts?: { description?: string; actorId?: string; metadata?: Record<string, unknown> },
  ) {
    return this.prisma.contactTimelineEvent.create({
      data: {
        contactId,
        workspaceId,
        eventType,
        title,
        description: opts?.description,
        actorId: opts?.actorId,
        metadata: (opts?.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
