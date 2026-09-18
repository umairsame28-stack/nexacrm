import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * Soft-delete helper — sets deletedAt to now
   */
  async softDelete(
    model: Parameters<typeof this.$queryRaw>[0] extends never ? never : string,
    id: string,
  ): Promise<void> {
    // Use dynamic property access via type assertion since Prisma models are dynamic
    const delegate = (this as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[model as string];
    if (!delegate) {
      throw new Error(`Unknown model: ${model as string}`);
    }
    await delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Paginate helper — returns items and cursor for next page
   */
  async paginate<T extends { id: string }>(
    items: T[],
    limit: number,
  ): Promise<{ items: T[]; nextCursor: string | null; hasNextPage: boolean }> {
    const hasNextPage = items.length > limit;
    const data = hasNextPage ? items.slice(0, limit) : items;
    const nextCursor =
      hasNextPage && data.length > 0
        ? Buffer.from(JSON.stringify({ id: data[data.length - 1].id })).toString('base64')
        : null;
    return { items: data, nextCursor, hasNextPage };
  }
}
