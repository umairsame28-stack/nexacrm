import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBroadcastDto } from '../dto/whatsapp.dto';
import { buildPaginatedResult, cursorToId } from '../../../common/utils/pagination.util';

@Injectable()
export class BroadcastService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('broadcast') private readonly broadcastQueue: Queue,
  ) {}

  async findAll(workspaceId: string, opts: { limit?: number; cursor?: string }) {
    const limit = Math.min(opts.limit ?? 25, 100);
    const cursorId = cursorToId(opts.cursor);

    const [broadcasts, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        where: { workspaceId },
        include: { recipients: { take: 0 } },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.broadcast.count({ where: { workspaceId } }),
    ]);

    return buildPaginatedResult(broadcasts, limit, total);
  }

  async findById(workspaceId: string, id: string) {
    const broadcast = await this.prisma.broadcast.findFirst({ where: { id, workspaceId } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return broadcast;
  }

  async create(workspaceId: string, dto: CreateBroadcastDto, creatorId: string) {
    // Build recipient list from filter criteria
    const filter = dto.filterCriteria ?? {};
    const contacts = await this.prisma.contact.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        ...(filter['tags']
          ? { tags: { some: { tag: { name: { in: filter['tags'] as string[] } } } } }
          : {}),
        ...(filter['status']
          ? { status: filter['status'] as import('@prisma/client').ContactStatus }
          : {}),
      },
      select: { id: true },
      take: 10_000,
    });

    const broadcast = await this.prisma.broadcast.create({
      data: {
        workspaceId,
        name: dto.name,
        templateId: dto.templateId,
        templateVars: dto.templateVars != null
          ? (dto.templateVars as Prisma.InputJsonValue)
          : undefined,
        filterCriteria: dto.filterCriteria != null
          ? (dto.filterCriteria as Prisma.InputJsonValue)
          : undefined,
        recipientCount: contacts.length,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        createdById: creatorId,
        recipients: {
          createMany: {
            data: contacts.map((c) => ({ contactId: c.id, status: 'PENDING' as const })),
            skipDuplicates: true,
          },
        },
      },
    });

    // If scheduled, queue for later
    if (dto.scheduledAt) {
      const delay = new Date(dto.scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        await this.broadcastQueue.add('send-broadcast', { broadcastId: broadcast.id, workspaceId }, { delay });
      }
    }

    return broadcast;
  }

  async send(workspaceId: string, id: string) {
    const broadcast = await this.prisma.broadcast.findFirst({ where: { id, workspaceId } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');

    if (broadcast.status === 'SENDING' || broadcast.status === 'SENT') {
      throw new BadRequestException('Broadcast is already sending or complete');
    }

    await this.prisma.broadcast.update({
      where: { id },
      data: { status: 'SENDING', startedAt: new Date() },
    });

    await this.broadcastQueue.add('send-broadcast', { broadcastId: id, workspaceId }, { priority: 1 });
    return { status: 'SENDING', message: 'Broadcast queued for delivery' };
  }

  async cancel(workspaceId: string, id: string) {
    const broadcast = await this.prisma.broadcast.findFirst({ where: { id, workspaceId } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');

    if (broadcast.status === 'SENT') {
      throw new BadRequestException('Cannot cancel a completed broadcast');
    }

    await this.prisma.broadcast.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
