import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ConversationFilterDto,
  UpdateConversationDto,
  AddLabelDto,
} from '../dto/whatsapp.dto';
import { buildPaginatedResult, cursorToId } from '../../../common/utils/pagination.util';
import { AppGateway } from '../../../websocket/app.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AppGateway,
  ) {}

  async findAll(workspaceId: string, filter: ConversationFilterDto) {
    const limit = Math.min(filter.limit ?? 25, 100);
    const cursorId = cursorToId(filter.cursor);

    const where = {
      workspaceId,
      ...(filter.status && { status: filter.status }),
      ...(filter.assignedTo === 'me'
        ? {}
        : filter.assignedTo
        ? { assignedToId: filter.assignedTo }
        : {}),
      ...(filter.isPinned !== undefined && { isPinned: filter.isPinned }),
      isArchived: false,
      ...(filter.label && {
        labels: { some: { label: { name: filter.label } } },
      }),
      ...(filter.search && {
        OR: [
          { contact: { firstName: { contains: filter.search, mode: 'insensitive' as const } } },
          { contact: { lastName: { contains: filter.search, mode: 'insensitive' as const } } },
          { contact: { phone: { contains: filter.search } } },
          { lastMessageText: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
          },
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          labels: { include: { label: { select: { id: true, name: true, color: true } } } },
        },
        orderBy: [{ isPinned: 'desc' }, { lastMessageAt: 'desc' }],
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return buildPaginatedResult(conversations, limit, total);
  }

  async findById(workspaceId: string, id: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        labels: { include: { label: true } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async update(workspaceId: string, id: string, dto: UpdateConversationDto) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        labels: { include: { label: true } },
      },
    });

    this.gateway.emitToWorkspace(workspaceId, 'conversation:updated', updated);
    return updated;
  }

  async addLabel(workspaceId: string, conversationId: string, dto: AddLabelDto) {
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    await this.prisma.conversationLabel.upsert({
      where: { conversationId_labelId: { conversationId, labelId: dto.labelId } },
      create: { conversationId, labelId: dto.labelId },
      update: {},
    });

    return this.findById(workspaceId, conversationId);
  }

  async removeLabel(workspaceId: string, conversationId: string, labelId: string) {
    await this.prisma.conversationLabel.deleteMany({
      where: { conversationId, labelId },
    });
  }

  async markAsRead(workspaceId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: { conversationId, direction: 'INBOUND', status: { not: 'READ' } },
        data: { readAt: new Date(), status: 'READ' },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      }),
    ]);
  }

  async upsertForContact(
    workspaceId: string,
    contactId: string,
    phoneNumberId: string,
  ) {
    return this.prisma.conversation.upsert({
      where: { workspaceId_contactId: { workspaceId, contactId } },
      create: {
        workspaceId,
        contactId,
        status: 'OPEN',
        whatsappPhoneNumberId: phoneNumberId,
      },
      update: { status: 'OPEN' },
    });
  }
}
