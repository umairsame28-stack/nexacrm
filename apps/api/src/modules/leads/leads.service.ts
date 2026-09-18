import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto, ConvertLeadDto } from './dto/create-lead.dto';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: CreateLeadDto, userId: string) {
    const lead = await this.prisma.lead.create({
      data: {
        workspaceId,
        contactId: dto.contactId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        title: dto.title,
        status: dto.status ?? 'NEW',
        source: dto.source ?? 'MANUAL',
        score: dto.score ?? 0,
        assignedToId: dto.assignedToId,
        followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : undefined,
        followUpNote: dto.followUpNote,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        stage: { select: { id: true, name: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        actorId: userId,
        field: 'status',
        oldValue: null,
        newValue: 'NEW',
      },
    });

    this.eventEmitter.emit('lead.created', { leadId: lead.id, workspaceId });
    return lead;
  }

  async findAll(workspaceId: string, filter: LeadFilterDto) {
    const limit = filter.limit ?? 25;
    const cursorId = cursorToId(filter.cursor);

    const where = {
      workspaceId,
      deletedAt: null,
      ...(filter.pipelineId && { pipelineId: filter.pipelineId }),
      ...(filter.stageId && { stageId: filter.stageId }),
      ...(filter.assignedTo && { assignedToId: filter.assignedTo }),
      ...(filter.status && { status: filter.status }),
      ...(filter.minScore !== undefined && { score: { gte: Number(filter.minScore) } }),
      ...(filter.maxScore !== undefined && {
        score: { ...(filter.minScore !== undefined ? { gte: Number(filter.minScore) } : {}), lte: Number(filter.maxScore) },
      }),
      ...(filter.search && {
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' as const } },
          { contact: { firstName: { contains: filter.search, mode: 'insensitive' as const } } },
          { contact: { lastName: { contains: filter.search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
          stage: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          pipeline: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.lead.count({ where }),
    ]);

    return buildPaginatedResult(leads, limit, total);
  }

  async getKanban(workspaceId: string, pipelineId?: string) {
    let pipeline = null;
    if (pipelineId) {
      pipeline = await this.prisma.pipeline.findFirst({ where: { id: pipelineId, workspaceId } });
    } else {
      pipeline = await this.prisma.pipeline.findFirst({ where: { workspaceId, isDefault: true } });
    }
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    const stages = await this.prisma.pipelineStage.findMany({
      where: { pipelineId: pipeline.id },
      include: {
        leads: {
          where: { workspaceId, deletedAt: null },
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { score: 'desc' },
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
        leads: s.leads,
        totalCount: s.leads.length,
      })),
    };
  }

  async findById(workspaceId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        contact: true,
        stage: true,
        pipeline: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        history: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(workspaceId: string, id: string, dto: Partial<UpdateLeadDto>, userId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.stageId !== undefined && { stageId: dto.stageId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.followUpAt !== undefined && { followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null }),
        ...(dto.followUpNote !== undefined && { followUpNote: dto.followUpNote }),
      },
      include: {
        stage: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true } },
      },
    });

    // Record history changes
    const historyItems: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
    if (dto.stageId && dto.stageId !== lead.stageId) {
      historyItems.push({ field: 'stageId', oldValue: lead.stageId, newValue: dto.stageId });
    }
    if (dto.assignedToId !== undefined && dto.assignedToId !== lead.assignedToId) {
      historyItems.push({ field: 'assignedToId', oldValue: lead.assignedToId, newValue: dto.assignedToId ?? null });
    }
    if (dto.status && dto.status !== lead.status) {
      historyItems.push({ field: 'status', oldValue: lead.status, newValue: dto.status });
    }

    if (historyItems.length > 0) {
      await this.prisma.leadHistory.createMany({
        data: historyItems.map((h) => ({ leadId: id, actorId: userId, ...h })),
      });
    }

    this.eventEmitter.emit('lead.updated', { leadId: id, workspaceId });
    return updated;
  }

  async moveStage(workspaceId: string, id: string, stageId: string, userId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.$transaction([
      this.prisma.lead.update({ where: { id }, data: { stageId } }),
      this.prisma.leadHistory.create({
        data: { leadId: id, actorId: userId, field: 'stageId', oldValue: lead.stageId, newValue: stageId },
      }),
    ]);

    this.eventEmitter.emit('lead.stage_changed', { leadId: id, workspaceId, oldStageId: lead.stageId, newStageId: stageId });
    return this.findById(workspaceId, id);
  }

  async convertToDeal(workspaceId: string, leadId: string, dto: ConvertLeadDto, userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, workspaceId, deletedAt: null },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') throw new BadRequestException('Lead is already converted');

    const deal = await this.prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          workspaceId,
          pipelineId: dto.dealPipelineId,
          stageId: dto.dealStageId,
          title: lead.title,
          value: dto.dealValue ?? 0,
          assignedToId: lead.assignedToId,
          contacts: { create: { contactId: lead.contactId } },
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      });

      await tx.leadHistory.create({
        data: { leadId, actorId: userId, field: 'status', oldValue: 'OPEN', newValue: 'CONVERTED' },
      });

      return newDeal;
    });

    return deal;
  }

  async remove(workspaceId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getHistory(workspaceId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.leadHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
