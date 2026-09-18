import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';
import type { NotificationType, NotificationChannel } from '@prisma/client';

interface CreateNotificationDto {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        workspaceId: dto.workspaceId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        link: dto.link,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAll(
    workspaceId: string,
    userId: string,
    opts: { isRead?: boolean; limit?: number; cursor?: string },
  ) {
    const limit = opts.limit ?? 25;
    const cursorId = cursorToId(opts.cursor);

    const where = {
      workspaceId,
      userId,
      ...(opts.isRead !== undefined && { isRead: opts.isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(notifications, limit, total);
  }

  async markAsRead(workspaceId: string, userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, workspaceId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(workspaceId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { workspaceId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(workspaceId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { workspaceId, userId, isRead: false },
    });
  }

  async getPreferences(userId: string, workspaceId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId, workspaceId },
    });
  }

  async updatePreferences(
    userId: string,
    workspaceId: string,
    preferences: Array<{ type: NotificationType; channel: NotificationChannel; isEnabled: boolean }>,
  ) {
    const upserts = preferences.map((p) =>
      this.prisma.notificationPreference.upsert({
        where: {
          userId_workspaceId_type_channel: {
            userId,
            workspaceId,
            type: p.type,
            channel: p.channel,
          },
        },
        create: {
          userId,
          workspaceId,
          type: p.type,
          channel: p.channel,
          isEnabled: p.isEnabled,
        },
        update: { isEnabled: p.isEnabled },
      }),
    );
    await this.prisma.$transaction(upserts);
    return this.getPreferences(userId, workspaceId);
  }

  async isChannelEnabled(
    userId: string,
    workspaceId: string,
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_workspaceId_type_channel: { userId, workspaceId, type, channel },
      },
    });
    // Default: enabled if no preference set
    return pref?.isEnabled ?? true;
  }
}
