import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkspaceQueryDto } from '../dto/admin-workspace.dto';

@Injectable()
export class AdminWorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all workspaces with pagination and filtering
   */
  async getAllWorkspaces(query: WorkspaceQueryDto) {
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Note: We'll add isActive field to Workspace model if needed
    // For now, we use deletedAt for soft deletes

    const [workspaces, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          timezone: true,
          currency: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          _count: {
            select: {
              members: true,
              contacts: true,
              leads: true,
              deals: true,
              conversations: true,
              tasks: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      data: workspaces,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single workspace by ID with detailed information
   */
  async getWorkspaceById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        settings: true,
        _count: {
          select: {
            contacts: true,
            leads: true,
            deals: true,
            conversations: true,
            tasks: true,
            auditLogs: true,
            notifications: true,
            broadcasts: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    return workspace;
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    const [
      membersCount,
      contactsCount,
      leadsCount,
      dealsCount,
      conversationsCount,
      tasksCount,
      messagesCount,
      aiUsageCount,
    ] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { workspaceId, isActive: true } }),
      this.prisma.contact.count({ where: { workspaceId } }),
      this.prisma.lead.count({ where: { workspaceId } }),
      this.prisma.deal.count({ where: { workspaceId } }),
      this.prisma.conversation.count({ where: { workspaceId } }),
      this.prisma.task.count({ where: { workspaceId } }),
      this.prisma.message.count({ where: { conversation: { workspaceId } } }),
      this.prisma.aiUsageLog.count({ where: { workspaceId } }),
    ]);

    return {
      workspaceId,
      workspaceName: workspace.name,
      stats: {
        members: membersCount,
        contacts: contactsCount,
        leads: leadsCount,
        deals: dealsCount,
        conversations: conversationsCount,
        tasks: tasksCount,
        messages: messagesCount,
        aiUsage: aiUsageCount,
      },
      createdAt: workspace.createdAt,
      lastActivity: workspace.updatedAt,
    };
  }

  /**
   * Suspend/Activate workspace (soft delete)
   */
  async updateWorkspaceStatus(
    workspaceId: string,
    isActive: boolean,
    reason: string | undefined,
    adminId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    const updatedWorkspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        deletedAt: isActive ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null, // System-wide action
        action: 'UPDATE',
        entityType: 'Workspace',
        entityId: workspaceId,
        changes: {
          status: { to: isActive ? 'active' : 'suspended' },
          reason: reason || 'No reason provided',
        },
      },
    });

    return updatedWorkspace;
  }

  /**
   * Delete workspace permanently (use with caution)
   */
  async deleteWorkspace(workspaceId: string, adminId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    // Log before deletion
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null,
        action: 'DELETE',
        entityType: 'Workspace',
        entityId: workspaceId,
        changes: {
          action: 'Workspace permanently deleted by admin',
          workspaceName: workspace.name,
        },
      },
    });

    // Hard delete workspace (cascades to related entities)
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deleted successfully' };
  }

  /**
   * Get workspace activity logs
   */
  async getWorkspaceActivity(workspaceId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { workspaceId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
