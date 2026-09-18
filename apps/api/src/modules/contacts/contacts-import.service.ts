import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

export interface ImportJobResult {
  jobId: string;
  status: string;
  totalRows: number;
}

@Injectable()
export class ContactsImportService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('csv-import') private readonly csvImportQueue: Queue,
  ) {}

  async startImport(
    workspaceId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ImportJobResult> {
    if (!fileName.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are supported');
    }
    if (fileBuffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }

    const job = await this.csvImportQueue.add(
      'import-contacts',
      {
        workspaceId,
        userId,
        csvContent: fileBuffer.toString('utf8'),
        fileName,
      },
      {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    // Count approximate rows
    const lines = fileBuffer.toString('utf8').split('\n').length - 1;

    return {
      jobId: String(job.id),
      status: 'PROCESSING',
      totalRows: Math.max(0, lines),
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.csvImportQueue.getJob(jobId);
    if (!job) {
      return { jobId, status: 'NOT_FOUND', imported: 0, skipped: 0, errors: [] };
    }

    const state = await job.getState();
    const progress = job.progress() as Record<string, unknown>;

    return {
      jobId,
      status: state.toUpperCase(),
      imported: (progress?.imported as number) ?? 0,
      skipped: (progress?.skipped as number) ?? 0,
      errors: (progress?.errors as string[]) ?? [],
    };
  }
}
