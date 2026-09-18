import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto } from './dto/create-contact.dto';
import { normalizePhone } from '../../common/utils/phone.util';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: CreateContactDto, creatorId: string) {
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new BadRequestException('Invalid phone number format. Use E.164 (e.g. +14155552671)');

    const existing = await this.prisma.contact.findUnique({
      where: { workspaceId_phone: { workspaceId, phone } },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('A contact with this phone number already exists');
    }

    const contact = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
        data: {
          workspaceId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone,
          email: dto.email?.toLowerCase(),
          company: dto.company,
          jobTitle: dto.jobTitle,
          status: dto.status ?? 'ACTIVE',
          source: dto.source,
          assignedToId: dto.assignedToId,
          notes: dto.notes,
        },
      });

      // Assign tags
      if (dto.tagIds && dto.tagIds.length > 0) {
        await tx.contactTagAssignment.createMany({
          data: dto.tagIds.map((tagId) => ({ contactId: created.id, tagId })),
          skipDuplicates: true,
        });
      }

      // Assign custom fields
      if (dto.customFields) {
        const fields = await tx.customFieldDefinition.findMany({
          where: { workspaceId, entityType: 'contact' },
        });
        const fieldMap = new Map(fields.map((f) => [f.key, f.id]));
        const values = Object.entries(dto.customFields)
          .filter(([key]) => fieldMap.has(key))
          .map(([key, value]) => ({
            contactId: created.id,
            fieldId: fieldMap.get(key)!,
            value: value as unknown as import('@prisma/client').Prisma.InputJsonValue,
          }));

        if (values.length > 0) {
          await tx.contactCustomFieldValue.createMany({ data: values, skipDuplicates: true });
        }
      }

      return created;
    });

    // Timeline event
    await this.prisma.contactTimelineEvent.create({
      data: {
        contactId: contact.id,
        workspaceId,
        eventType: 'contact_created',
        title: 'Contact created',
        actorId: creatorId,
      },
    });

    this.eventEmitter.emit('contact.created', { contactId: contact.id, workspaceId });
    return this.findById(workspaceId, contact.id);
  }

  async findAll(workspaceId: string, filter: ContactFilterDto) {
    const limit = filter.limit ?? 25;
    const cursorId = cursorToId(filter.cursor);
    const tagFilter = filter.tags ? filter.tags.split(',').map((t) => t.trim()) : undefined;

    const where = {
      workspaceId,
      deletedAt: null,
      ...(filter.status && { status: filter.status }),
      ...(filter.assignedTo && { assignedToId: filter.assignedTo }),
      ...(filter.search && {
        OR: [
          { firstName: { contains: filter.search, mode: 'insensitive' as const } },
          { lastName: { contains: filter.search, mode: 'insensitive' as const } },
          { phone: { contains: filter.search } },
          { email: { contains: filter.search, mode: 'insensitive' as const } },
          { company: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(tagFilter && {
        tags: {
          some: { tag: { name: { in: tagFilter } } },
        },
      }),
    };

    const sortField = filter.sortBy ?? 'createdAt';
    const sortDir = filter.sortOrder ?? 'desc';

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        },
        orderBy: { [sortField]: sortDir },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.contact.count({ where }),
    ]);

    return buildPaginatedResult(contacts, limit, total);
  }

  async findById(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        customValues: { include: { field: true } },
        contactNotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        leads: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, score: true, createdAt: true },
          take: 5,
        },
        deals: {
          include: { deal: { select: { id: true, title: true, status: true, value: true } } },
          take: 5,
        },
      },
    });

    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(workspaceId: string, id: string, dto: Partial<UpdateContactDto>, userId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    let phone = contact.phone;
    if (dto.phone && dto.phone !== contact.phone) {
      phone = normalizePhone(dto.phone) ?? contact.phone;
      const existing = await this.prisma.contact.findFirst({
        where: { workspaceId, phone, deletedAt: null, id: { not: id } },
      });
      if (existing) throw new ConflictException('Another contact with this phone already exists');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contact.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone }),
          ...(dto.email !== undefined && { email: dto.email?.toLowerCase() }),
          ...(dto.company !== undefined && { company: dto.company }),
          ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.source !== undefined && { source: dto.source }),
          ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });

      // Update tags if provided
      if (dto.tagIds !== undefined) {
        await tx.contactTagAssignment.deleteMany({ where: { contactId: id } });
        if (dto.tagIds.length > 0) {
          await tx.contactTagAssignment.createMany({
            data: dto.tagIds.map((tagId) => ({ contactId: id, tagId })),
            skipDuplicates: true,
          });
        }
      }

      return result;
    });

    await this.prisma.contactTimelineEvent.create({
      data: {
        contactId: id,
        workspaceId,
        eventType: 'contact_updated',
        title: 'Contact updated',
        actorId: userId,
      },
    });

    return this.findById(workspaceId, id);
  }

  async softDelete(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId, deletedAt: { not: null } },
    });
    if (!contact) throw new NotFoundException('Deleted contact not found');

    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
