import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactsMergeService {
  constructor(private readonly prisma: PrismaService) {}

  async merge(workspaceId: string, primaryId: string, duplicateId: string) {
    if (primaryId === duplicateId) {
      throw new BadRequestException('Primary and duplicate contacts cannot be the same');
    }

    const [primary, duplicate] = await Promise.all([
      this.prisma.contact.findFirst({ where: { id: primaryId, workspaceId, deletedAt: null } }),
      this.prisma.contact.findFirst({ where: { id: duplicateId, workspaceId, deletedAt: null } }),
    ]);

    if (!primary) throw new NotFoundException('Primary contact not found');
    if (!duplicate) throw new NotFoundException('Duplicate contact not found');

    await this.prisma.$transaction(async (tx) => {
      // Reassign all relations from duplicate to primary
      await tx.contactNote.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });
      await tx.contactTimelineEvent.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });
      await tx.lead.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });
      await tx.contactDeal.updateMany({
        where: { contactId: duplicateId, dealId: { notIn: await tx.contactDeal
          .findMany({ where: { contactId: primaryId }, select: { dealId: true } })
          .then((r) => r.map((x) => x.dealId)) } },
        data: { contactId: primaryId },
      });
      await tx.conversation.updateMany({
        where: { contactId: duplicateId, workspaceId },
        data: { contactId: primaryId },
      });
      await tx.task.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });

      // Merge tags (skip duplicates)
      const duplicateTags = await tx.contactTagAssignment.findMany({
        where: { contactId: duplicateId },
      });
      await tx.contactTagAssignment.createMany({
        data: duplicateTags.map((t) => ({ contactId: primaryId, tagId: t.tagId })),
        skipDuplicates: true,
      });

      // Mark duplicate as merged
      await tx.contact.update({
        where: { id: duplicateId },
        data: { deletedAt: new Date(), mergedIntoId: primaryId },
      });

      // Timeline event
      await tx.contactTimelineEvent.create({
        data: {
          contactId: primaryId,
          workspaceId,
          eventType: 'contact_merged',
          title: `Contact merged with ${duplicate.firstName} ${duplicate.lastName ?? ''}`.trim(),
          metadata: { mergedContactId: duplicateId },
        },
      });
    });

    return this.prisma.contact.findUnique({
      where: { id: primaryId },
      include: { tags: { include: { tag: true } } },
    });
  }

  async findDuplicates(workspaceId: string) {
    // Find contacts sharing the same email
    const emailDuplicates = await this.prisma.$queryRaw<
      Array<{ phone: string; count: bigint }>
    >`
      SELECT phone, COUNT(*) as count
      FROM "Contact"
      WHERE "workspaceId" = ${workspaceId}
        AND "deletedAt" IS NULL
      GROUP BY phone
      HAVING COUNT(*) > 1
    `;

    const results = [];
    for (const dup of emailDuplicates) {
      const contacts = await this.prisma.contact.findMany({
        where: { workspaceId, phone: dup.phone, deletedAt: null },
        take: 2,
      });
      if (contacts.length >= 2) {
        results.push({
          contact1: contacts[0],
          contact2: contacts[1],
          confidence: 1.0,
          matchedOn: ['phone'],
        });
      }
    }
    return { data: results };
  }
}
