import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/create-task.dto';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';
import type { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: CreateTaskDto, creatorId: string) {
    const task = await this.prisma.task.create({
      data: {
        workspaceId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : undefined,
        assignedToId: dto.assignedToId,
        createdById: creatorId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
      },
      include: this.defaultInclude(),
    });

    this.eventEmitter.emit('task.created', { taskId: task.id, workspaceId });
    return task;
  }

  async findAll(workspaceId: string, filter: TaskFilterDto, requestingUserId: string) {
    const limit = Math.min(filter.limit ?? 25, 100);
    const cursorId = cursorToId(filter.cursor);

    const assignedTo =
      filter.assignedTo === 'me' ? requestingUserId : filter.assignedTo;

    const where = {
      workspaceId,
      deletedAt: null,
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(filter.status && { status: filter.status }),
      ...(filter.priority && { priority: filter.priority }),
      ...(filter.contactId && { contactId: filter.contactId }),
      ...(filter.dealId && { dealId: filter.dealId }),
      ...(filter.dueFrom || filter.dueTo
        ? {
            dueAt: {
              ...(filter.dueFrom ? { gte: new Date(filter.dueFrom) } : {}),
              ...(filter.dueTo ? { lte: new Date(filter.dueTo) } : {}),
            },
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.task.count({ where }),
    ]);

    return buildPaginatedResult(tasks, limit, total);
  }

  async getKanban(workspaceId: string, requestingUserId: string, assignedTo?: string) {
    const userId = assignedTo === 'me' ? requestingUserId : assignedTo;

    const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
    const columns = await Promise.all(
      statuses.map(async (status) => {
        const tasks = await this.prisma.task.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            status,
            ...(userId && { assignedToId: userId }),
          },
          include: this.defaultInclude(),
          orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
          take: 50,
        });
        return { status, tasks, count: tasks.length };
      }),
    );

    return { columns };
  }

  async findById(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: this.defaultInclude(),
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: Partial<UpdateTaskDto>,
    userId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dueAt !== undefined && { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }),
        ...(dto.remindAt !== undefined && { remindAt: dto.remindAt ? new Date(dto.remindAt) : null }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.dealId !== undefined && { dealId: dto.dealId }),
      },
      include: this.defaultInclude(),
    });

    this.eventEmitter.emit('task.updated', { taskId: id, workspaceId, updatedById: userId });
    return updated;
  }

  async complete(workspaceId: string, id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: 'DONE', completedAt: new Date() },
      include: this.defaultInclude(),
    });

    this.eventEmitter.emit('task.completed', { taskId: id, workspaceId, completedById: userId });
    return updated;
  }

  async remove(workspaceId: string, id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Only creator or assignee can delete
    if (task.createdById !== userId && task.assignedToId !== userId) {
      throw new ForbiddenException('Only the task creator or assignee can delete it');
    }

    await this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private defaultInclude() {
    return {
      assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
      deal: { select: { id: true, title: true, value: true } },
    } as const;
  }
}
