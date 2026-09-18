import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePhone } from '../../common/utils/phone.util';
import { parse } from 'csv-parse/sync';

interface CsvImportJob {
  workspaceId: string;
  jobId: string;
  csvContent: string;
  creatorId: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

@Processor('csv-import')
export class CsvImportProcessor {
  private readonly logger = new Logger(CsvImportProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('import-contacts')
  async handleCsvImport(job: Job<CsvImportJob>): Promise<ImportResult> {
    const { workspaceId, jobId, csvContent, creatorId } = job.data;
    this.logger.log(`Processing CSV import job ${jobId} for workspace ${workspaceId}`);

    let rows: Record<string, string>[];
    try {
      rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
    } catch (err) {
      throw new Error(`CSV parse error: ${String(err)}`);
    }

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header row and 1-based index

      try {
        const rawPhone = row['phone'] ?? row['Phone'] ?? row['PHONE'] ?? row['mobile'] ?? '';
        if (!rawPhone) {
          result.errors.push({ row: rowNum, error: 'Phone number is required' });
          continue;
        }

        const phone = normalizePhone(rawPhone);
        if (!phone) {
          result.errors.push({ row: rowNum, error: `Invalid phone number: ${rawPhone}` });
          continue;
        }

        const firstName =
          row['first_name'] ?? row['firstName'] ?? row['First Name'] ?? row['name'] ?? phone;
        const lastName = row['last_name'] ?? row['lastName'] ?? row['Last Name'] ?? undefined;
        const email = row['email'] ?? row['Email'] ?? undefined;
        const company = row['company'] ?? row['Company'] ?? undefined;
        const jobTitle = row['job_title'] ?? row['jobTitle'] ?? row['Job Title'] ?? undefined;

        // Upsert (import is idempotent on phone number)
        const existing = await this.prisma.contact.findUnique({
          where: { workspaceId_phone: { workspaceId, phone } },
        });

        if (existing && !existing.deletedAt) {
          result.skipped++;
          continue;
        }

        await this.prisma.contact.upsert({
          where: { workspaceId_phone: { workspaceId, phone } },
          create: {
            workspaceId,
            phone,
            firstName,
            lastName,
            email: email?.toLowerCase(),
            company,
            jobTitle,
            source: 'IMPORT',
            status: 'ACTIVE',
          },
          update: {
            firstName,
            lastName,
            email: email?.toLowerCase(),
            company,
            jobTitle,
            deletedAt: null,
          },
        });

        result.imported++;
      } catch (err) {
        result.errors.push({ row: rowNum, error: String(err) });
        this.logger.warn(`Row ${rowNum} import error: ${String(err)}`);
      }

      // Update job progress every 100 rows
      if ((i + 1) % 100 === 0) {
        await job.progress(Math.round(((i + 1) / rows.length) * 100));
      }
    }

    this.logger.log(
      `CSV import ${jobId} done: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`,
    );

    return result;
  }
}
