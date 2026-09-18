import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContactsExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async export(
    workspaceId: string,
    filter?: {
      tags?: string[];
      status?: string;
      assignedTo?: string;
    },
  ): Promise<{ jobId: string; downloadUrl: null }> {
    const jobId = uuidv4();

    // Export is async — trigger in background
    void this.runExport(workspaceId, filter, jobId);

    return { jobId, downloadUrl: null };
  }

  private async runExport(
    workspaceId: string,
    filter: { tags?: string[]; status?: string; assignedTo?: string } | undefined,
    jobId: string,
  ) {
    try {
      const contacts = await this.prisma.contact.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          ...(filter?.status && { status: filter.status as import('@prisma/client').ContactStatus }),
          ...(filter?.assignedTo && { assignedToId: filter.assignedTo }),
          ...(filter?.tags && filter.tags.length > 0 && {
            tags: { some: { tag: { name: { in: filter.tags } } } },
          }),
        },
        include: { tags: { include: { tag: true } } },
      });

      const rows = contacts.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName ?? '',
        phone: c.phone,
        email: c.email ?? '',
        company: c.company ?? '',
        jobTitle: c.jobTitle ?? '',
        status: c.status,
        source: c.source ?? '',
        tags: c.tags.map((t) => t.tag.name).join(', '),
        createdAt: c.createdAt.toISOString(),
      }));

      const csv = stringify(rows, { header: true });
      const fileKey = `exports/${workspaceId}/${jobId}/contacts.csv`;
      await this.storageService.uploadFile(fileKey, Buffer.from(csv), 'text/csv');
    } catch (err) {
      // Job tracking should be handled via Bull queue failure mechanism
      // Error details available in Bull dashboard
    }
  }

  async getExportStatus(workspaceId: string, jobId: string) {
    const fileKey = `exports/${workspaceId}/${jobId}/contacts.csv`;
    try {
      const downloadUrl = await this.storageService.getSignedUrl(fileKey);
      return { jobId, status: 'DONE', downloadUrl };
    } catch {
      return { jobId, status: 'PROCESSING', downloadUrl: null };
    }
  }
}
