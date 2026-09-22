import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      count: jest.fn(),
    },
    refreshToken: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return paginated users with metadata', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          status: 'ACTIVE',
          systemRole: 'USER',
          _count: { workspaceMembers: 2, refreshTokens: 1 },
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.getAllUsers({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
    });

    it('should filter by search query', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getAllUsers({ page: 1, limit: 20, search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: 'john', mode: 'insensitive' } },
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getAllUsers({ page: 1, limit: 20, status: 'SUSPENDED' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SUSPENDED',
          }),
        }),
      );
    });
  });

  describe('getUserById', () => {
    it('should return user with detailed information', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        workspaceMembers: [],
        refreshTokens: [],
        _count: { assignedLeads: 5, assignedDeals: 3 },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        status: 'ACTIVE',
      };

      const updatedUser = { ...mockUser, status: 'SUSPENDED' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      const result = await service.updateUserStatus(
        'user-1',
        { status: 'SUSPENDED', reason: 'Test' },
        'admin-1',
      );

      expect(result.status).toBe('SUSPENDED');
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException when admin tries to suspend themselves', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        status: 'ACTIVE',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.updateUserStatus(
          'admin-1',
          { status: 'SUSPENDED' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus(
          'nonexistent',
          { status: 'SUSPENDED' },
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        systemRole: 'USER',
        status: 'ACTIVE',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      const result = await service.deleteUser('user-1', 'admin-1');

      expect(result).toEqual({ message: 'User account deleted successfully' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('should throw BadRequestException when trying to delete super admin', async () => {
      const mockUser = {
        id: 'super-1',
        systemRole: 'SUPER_ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.deleteUser('super-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to delete self', async () => {
      const mockUser = {
        id: 'admin-1',
        systemRole: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.deleteUser('admin-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('promoteToSuperAdmin', () => {
    it('should promote user to super admin', async () => {
      const mockUser = {
        id: 'user-1',
        systemRole: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        systemRole: 'SUPER_ADMIN',
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.promoteToSuperAdmin('user-1', 'admin-1');

      expect(result).toEqual({
        message: 'User promoted to super admin successfully',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { systemRole: 'SUPER_ADMIN' },
      });
    });

    it('should throw BadRequestException if already super admin', async () => {
      const mockUser = {
        id: 'user-1',
        systemRole: 'SUPER_ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.promoteToSuperAdmin('user-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('demoteFromSuperAdmin', () => {
    it('should demote super admin to regular user', async () => {
      const mockUser = {
        id: 'super-1',
        systemRole: 'SUPER_ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        systemRole: 'USER',
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.demoteFromSuperAdmin('super-1', 'admin-1');

      expect(result).toEqual({
        message: 'User demoted to regular user successfully',
      });
    });

    it('should throw BadRequestException when trying to demote self', async () => {
      const mockUser = {
        id: 'admin-1',
        systemRole: 'SUPER_ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.demoteFromSuperAdmin('admin-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if not a super admin', async () => {
      const mockUser = {
        id: 'user-1',
        systemRole: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.demoteFromSuperAdmin('user-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserActivity', () => {
    it('should return paginated activity logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.getUserActivity('user-1', 1, 50);

      expect(result).toEqual({
        data: mockLogs,
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });
    });
  });
});
