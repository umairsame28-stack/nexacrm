import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminSystemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get system-wide statistics dashboard
   */
  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      superAdmins,
      totalWorkspaces,
      activeWorkspaces,
      totalContacts,
      totalLeads,
      totalDeals,
      totalConversations,
      totalMessages,
      recentLogins,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { systemRole: 'SUPER_ADMIN' } }),
      this.prisma.workspace.count(),
      this.prisma.workspace.count({ where: { deletedAt: null } }),
      this.prisma.contact.count(),
      this.prisma.lead.count(),
      this.prisma.deal.count(),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        superAdmins,
        recentLogins,
      },
      workspaces: {
        total: totalWorkspaces,
        active: activeWorkspaces,
        suspended: totalWorkspaces - activeWorkspaces,
      },
      data: {
        contacts: totalContacts,
        leads: totalLeads,
        deals: totalDeals,
        conversations: totalConversations,
        messages: totalMessages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent activity across the system
   */
  async getRecentActivity(limit = 50) {
    const activities = await this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            systemRole: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities;
  }

  /**
   * Get failed login attempts (security monitoring)
   */
  async getFailedLogins(hours = 24, limit = 100) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const failedLogins = await this.prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: since,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Group by user to find suspicious activity
    const failuresByUser: Record<string, number> = {};
    failedLogins.forEach((log) => {
      const email = log.user?.email || 'unknown';
      failuresByUser[email] = (failuresByUser[email] || 0) + 1;
    });

    const suspiciousUsers = Object.entries(failuresByUser)
      .filter(([, count]) => count >= 5) // 5+ failures
      .sort((a, b) => b[1] - a[1])
      .map(([email, count]) => ({ email, failureCount: count }));

    return {
      recentFailures: failedLogins,
      suspiciousActivity: suspiciousUsers,
      totalFailures: failedLogins.length,
      timeRange: `${hours} hours`,
    };
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowth(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    });

    // Group by day
    const usersByDay = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      totalNewUsers: newUsers,
      period: `${days} days`,
      dailyBreakdown: usersByDay.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    };
  }

  /**
   * Get workspace growth statistics
   */
  async getWorkspaceGrowth(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const newWorkspaces = await this.prisma.workspace.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    });

    const workspacesByDay = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Workspace"
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      totalNewWorkspaces: newWorkspaces,
      period: `${days} days`,
      dailyBreakdown: workspacesByDay.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    const [
      activeSessionsCount,
      pendingTasksCount,
      failedMessagesCount,
      aiUsageToday,
    ] = await Promise.all([
      this.prisma.refreshToken.count({
        where: {
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
      this.prisma.task.count({
        where: {
          status: {
            in: ['TODO', 'IN_PROGRESS'],
          },
        },
      }),
      this.prisma.message.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.aiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      activeSessions: activeSessionsCount,
      pendingTasks: pendingTasksCount,
      failedMessages: failedMessagesCount,
      aiUsageToday,
      status: 'healthy', // Could add more sophisticated health checks
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get super admin list
   */
  async getSuperAdmins() {
    const superAdmins = await this.prisma.user.findMany({
      where: {
        systemRole: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return superAdmins;
  }
}
