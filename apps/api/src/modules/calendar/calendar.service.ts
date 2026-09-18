import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, EventFilterDto } from './dto/create-event.dto';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: CreateEventDto, creatorId: string) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);

    if (!dto.allDay && end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.calendarEvent.create({
        data: {
          workspaceId,
          title: dto.title,
          description: dto.description,
          startAt: start,
          endAt: end,
          allDay: dto.allDay ?? false,
          location: dto.location,
          color: dto.color,
          createdById: creatorId,
          contactId: dto.contactId,
          leadId: dto.leadId,
          dealId: dto.dealId,
          remindAt: dto.remindAt ? new Date(dto.remindAt) : undefined,
        },
      });

      if (dto.attendeeIds && dto.attendeeIds.length > 0) {
        await tx.calendarEventAttendee.createMany({
          data: dto.attendeeIds.map((userId) => ({
            eventId: created.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    this.eventEmitter.emit('calendar.event_created', { eventId: event.id, workspaceId });
    return this.findById(workspaceId, event.id);
  }

  async findAll(workspaceId: string, filter: EventFilterDto, requestingUserId: string) {
    let from: Date;
    let to: Date;

    try {
      from = filter.from
        ? startOfDay(new Date(filter.from))
        : startOfDay(new Date());
      to = filter.to
        ? endOfDay(new Date(filter.to))
        : endOfDay(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    } catch (error) {
      throw new BadRequestException('Invalid date format. Please use ISO 8601 format.');
    }

    const userId =
      filter.assignedTo === 'me' ? requestingUserId : filter.assignedTo;

    const where = {
      workspaceId,
      startAt: { gte: from, lte: to },
      ...(userId && {
        OR: [
          { createdById: userId },
          { attendees: { some: { userId } } },
        ],
      }),
    };

    return this.prisma.calendarEvent.findMany({
      where,
      include: this.defaultInclude(),
      orderBy: { startAt: 'asc' },
    });
  }

  async findById(workspaceId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, workspaceId },
      include: this.defaultInclude(),
    });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }

  async update(workspaceId: string, id: string, dto: Partial<UpdateEventDto>, userId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, workspaceId },
    });
    if (!event) throw new NotFoundException('Calendar event not found');

    const start = dto.startAt ? new Date(dto.startAt) : event.startAt;
    const end = dto.endAt ? new Date(dto.endAt) : event.endAt;

    if (!dto.allDay && end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.calendarEvent.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.startAt !== undefined && { startAt: start }),
          ...(dto.endAt !== undefined && { endAt: end }),
          ...(dto.allDay !== undefined && { allDay: dto.allDay }),
          ...(dto.location !== undefined && { location: dto.location }),
          ...(dto.color !== undefined && { color: dto.color }),
          ...(dto.contactId !== undefined && { contactId: dto.contactId }),
          ...(dto.dealId !== undefined && { dealId: dto.dealId }),
          ...(dto.remindAt !== undefined && {
            remindAt: dto.remindAt ? new Date(dto.remindAt) : null,
          }),
        },
      });

      if (dto.attendeeIds !== undefined) {
        await tx.calendarEventAttendee.deleteMany({ where: { eventId: id } });
        if (dto.attendeeIds.length > 0) {
          await tx.calendarEventAttendee.createMany({
            data: dto.attendeeIds.map((uid) => ({ eventId: id, userId: uid })),
            skipDuplicates: true,
          });
        }
      }

      return result;
    });

    this.eventEmitter.emit('calendar.event_updated', { eventId: id, workspaceId });
    return this.findById(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, workspaceId },
    });
    if (!event) throw new NotFoundException('Calendar event not found');

    await this.prisma.$transaction([
      this.prisma.calendarEventAttendee.deleteMany({ where: { eventId: id } }),
      this.prisma.calendarEvent.delete({ where: { id } }),
    ]);
  }

  private defaultInclude() {
    return {
      createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      attendees: true,
    } as const;
  }
}
