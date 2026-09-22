import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserQueryDto, UpdateUserStatusDto } from '../dto/admin-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(query: UserQueryDto) {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          status: true,
          systemRole: true,
          emailVerified: true,
          totpEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              workspaceMembers: true,
              refreshTokens: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single user by ID with detailed information
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
        refreshTokens: {
          where: { revokedAt: null },
          select: {
            id: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            assignedLeads: true,
            assignedDeals: true,
            tasks: true,
            messages: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Update user status (activate, suspend, etc.)
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent super admins from suspending themselves
    if (userId === adminId && dto.status === 'SUSPENDED') {
      throw new BadRequestException('Cannot suspend your own account');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true,
      },
    });

    // Log the action in audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null, // System-wide action
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        changes: {
          status: { from: user.status, to: dto.status },
          reason: dto.reason || 'No reason provided',
        },
      },
    });

    // If suspending, revoke all active sessions
    if (dto.status === 'SUSPENDED') {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return updatedUser;
  }

  /**
   * Reset user password (admin-initiated)
   */
  async resetUserPassword(userId: string, newPassword: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        changes: {
          action: 'Password reset by admin',
        },
      },
    });

    // Revoke all active sessions for security
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Password reset successfully. All sessions have been revoked.' };
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
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

  /**
   * Delete user account (soft delete by marking as INACTIVE)
   */
  async deleteUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent deleting super admins
    if (user.systemRole === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot delete super admin accounts');
    }

    // Prevent self-deletion
    if (userId === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Soft delete: set status to INACTIVE
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null,
        action: 'DELETE',
        entityType: 'User',
        entityId: userId,
        changes: {
          action: 'User account deleted by admin',
        },
      },
    });

    // Revoke all sessions
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'User account deleted successfully' };
  }

  /**
   * Promote user to super admin
   */
  async promoteToSuperAdmin(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.systemRole === 'SUPER_ADMIN') {
      throw new BadRequestException('User is already a super admin');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { systemRole: 'SUPER_ADMIN' },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        changes: {
          systemRole: { from: 'USER', to: 'SUPER_ADMIN' },
        },
      },
    });

    return { message: 'User promoted to super admin successfully' };
  }

  /**
   * Demote super admin to regular user
   */
  async demoteFromSuperAdmin(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.systemRole !== 'SUPER_ADMIN') {
      throw new BadRequestException('User is not a super admin');
    }

    // Prevent self-demotion
    if (userId === adminId) {
      throw new BadRequestException('Cannot demote yourself');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { systemRole: 'USER' },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId: null,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        changes: {
          systemRole: { from: 'SUPER_ADMIN', to: 'USER' },
        },
      },
    });

    return { message: 'User demoted to regular user successfully' };
  }
}
