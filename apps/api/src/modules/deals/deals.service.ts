import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDealDto,
  UpdateDealDto,
  DealFilterDto,
  MarkDealWonDto,
  MarkDealLostDto,
  CreateDealNoteDto,
} from './dto/create-deal.dto';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: CreateDealDto, userId: string) {
    const deal = await this.prisma.deal.create({
      data: {
        workspaceId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        title: dto.title,
        value: dto.value ?? 0,
        currency: dto.currency ?? 'USD',
        probability: dto.probability ?? 0,
        status: dto.status ?? 'OPEN',
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        assignedToId: dto.assignedToId,
        contacts: dto.contactIds?.length
          ? { create: dto.contactIds.map((id) => ({ contactId: id })) }
          : undefined,
      },
      include: {
        stage: { select: { id: true, name: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    await this.prisma.dealHistory.create({
      data: { dealId: deal.id, actorId: userId, field: 'status', oldValue: null, newValue: 'OPEN' },
    });

    this.eventEmitter.emit('deal.created', { dealId: deal.id, workspaceId });
    return deal;
  }

  async findAll(workspaceId: string, filter: DealFilterDto) {
    const limit = filter.limit ?? 25;
    const cursorId = cursorToId(filter.cursor);

    const where = {
      workspaceId,
      deletedAt: null,
      ...(filter.pipelineId && { pipelineId: filter.pipelineId }),
      ...(filter.stageId && { stageId: filter.stageId }),
      ...(filter.status && { status: filter.status }),
      ...(filter.assignedTo && { assignedToId: filter.assignedTo }),
      ...(filter.minValue !== undefined && { value: { gte: Number(filter.minValue) } }),
      ...(filter.maxValue !== undefined && {
        value: {
          ...(filter.minValue !== undefined ? { gte: Number(filter.minValue) } : {}),
          lte: Number(filter.maxValue),
        },
      }),
      ...(filter.search && {
        title: { contains: filter.search, mode: 'insensitive' as const },
      }),
    };

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: {
          stage: { select: { id: true, name: true, color: true } },
          pipeline: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.deal.count({ where }),
    ]);

    return buildPaginatedResult(deals, limit, total);
  }

  async getKanban(workspaceId: string, pipelineId?: string) {
    let pipeline = null;
    if (pipelineId) {
      pipeline = await this.prisma.dealPipeline.findFirst({ where: { id: pipelineId, workspaceId } });
    } else {
      pipeline = await this.prisma.dealPipeline.findFirst({ where: { workspaceId, isDefault: true } });
    }
    if (!pipeline) throw new NotFoundException('Deal pipeline not found');

    const stages = await this.prisma.dealStage.findMany({
      where: { pipelineId: pipeline.id },
      include: {
        deals: {
          where: { workspaceId, status: 'OPEN', deletedAt: null },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true } } }, take: 1 },
          },
          orderBy: { value: 'desc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        sortOrder: s.sortOrder,
        probability: s.probability,
        deals: s.deals,
        totalValue: s.deals.reduce((sum, d) => sum + Number(d.value), 0),
        totalCount: s.deals.length,
      })),
    };
  }

  async findById(workspaceId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        stage: true,
        pipeline: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contacts: { include: { contact: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        history: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' }, take: 10 },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async update(workspaceId: string, id: string, dto: Partial<UpdateDealDto>, userId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Deal not found');

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.stageId !== undefined && { stageId: dto.stageId }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.probability !== undefined && { probability: dto.probability }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.expectedCloseDate !== undefined && {
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        }),
      },
      include: {
        stage: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true } },
      },
    });

    // Record history
    const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
    if (dto.stageId && dto.stageId !== deal.stageId) {
      changes.push({ field: 'stageId', oldValue: deal.stageId, newValue: dto.stageId });
    }
    if (dto.value !== undefined && Number(dto.value) !== Number(deal.value)) {
      changes.push({ field: 'value', oldValue: String(deal.value), newValue: String(dto.value) });
    }

    if (changes.length > 0) {
      await this.prisma.dealHistory.createMany({
        data: changes.map((c) => ({ dealId: id, actorId: userId, ...c })),
      });
    }

    this.eventEmitter.emit('deal.updated', { dealId: id, workspaceId, stageId: updated.stageId });
    return updated;
  }

  async markWon(workspaceId: string, id: string, dto: MarkDealWonDto, userId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Deal not found');

    await this.prisma.$transaction([
      this.prisma.deal.update({
        where: { id },
        data: { status: 'WON', closedAt: dto.closedAt ? new Date(dto.closedAt) : new Date() },
      }),
      this.prisma.dealHistory.create({
        data: { dealId: id, actorId: userId, field: 'status', oldValue: deal.status, newValue: 'WON' },
      }),
    ]);

    this.eventEmitter.emit('deal.won', { dealId: id, workspaceId });
    return this.findById(workspaceId, id);
  }

  async markLost(workspaceId: string, id: string, dto: MarkDealLostDto, userId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Deal not found');

    await this.prisma.$transaction([
      this.prisma.deal.update({
        where: { id },
        data: { status: 'LOST', closedAt: new Date(), lostReason: dto.lostReason },
      }),
      this.prisma.dealHistory.create({
        data: { dealId: id, actorId: userId, field: 'status', oldValue: deal.status, newValue: 'LOST' },
      }),
    ]);

    this.eventEmitter.emit('deal.lost', { dealId: id, workspaceId });
    return this.findById(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addNote(workspaceId: string, dealId: string, dto: CreateDealNoteDto, userId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, workspaceId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.prisma.dealNote.create({
      data: { dealId, authorId: userId, content: dto.content },
    });
  }

  async getNotes(workspaceId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, workspaceId } });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.prisma.dealNote.findMany({ where: { dealId }, orderBy: { createdAt: 'desc' } });
  }

  async getHistory(workspaceId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, workspaceId } });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.prisma.dealHistory.findMany({ where: { dealId }, orderBy: { createdAt: 'desc' } });
  }
}
