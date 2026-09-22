import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminWorkspacesService } from './admin-workspaces.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AdminWorkspacesService', () => {
  let service: AdminWorkspacesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    workspace: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      count: jest.fn(),
    },
    contact: {
      count: jest.fn(),
    },
    lead: {
      count: jest.fn(),
    },
    deal: {
      count: jest.fn(),
    },
    conversation: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
    aiUsageLog: {
      count: jest.fn(),
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
        AdminWorkspacesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminWorkspacesService>(AdminWorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllWorkspaces', () => {
    it('should return paginated workspaces', async () => {
      const mockWorkspaces = [
        {
          id: 'ws-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          _count: { members: 5, contacts: 100 },
        },
      ];

      mockPrismaService.workspace.findMany.mockResolvedValue(mockWorkspaces);
      mockPrismaService.workspace.count.mockResolvedValue(1);

      const result = await service.getAllWorkspaces({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockWorkspaces,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should filter by search query', async () => {
      mockPrismaService.workspace.findMany.mockResolvedValue([]);
      mockPrismaService.workspace.count.mockResolvedValue(0);

      await service.getAllWorkspaces({ page: 1, limit: 20, search: 'acme' });

      expect(prisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'acme', mode: 'insensitive' } },
              { slug: { contains: 'acme', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('getWorkspaceById', () => {
    it('should return workspace with detailed information', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Acme Corp',
        members: [],
        settings: {},
        _count: { contacts: 100, leads: 50 },
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspaceById('ws-1');

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getWorkspaceById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWorkspaceStats', () => {
    it('should return comprehensive workspace statistics', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Acme Corp',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspaceMember.count.mockResolvedValue(10);
      mockPrismaService.contact.count.mockResolvedValue(100);
      mockPrismaService.lead.count.mockResolvedValue(50);
      mockPrismaService.deal.count.mockResolvedValue(25);
      mockPrismaService.conversation.count.mockResolvedValue(200);
      mockPrismaService.task.count.mockResolvedValue(75);
      mockPrismaService.message.count.mockResolvedValue(1000);
      mockPrismaService.aiUsageLog.count.mockResolvedValue(150);

      const result = await service.getWorkspaceStats('ws-1');

      expect(result).toMatchObject({
        workspaceId: 'ws-1',
        workspaceName: 'Acme Corp',
        stats: {
          members: 10,
          contacts: 100,
          leads: 50,
          deals: 25,
          conversations: 200,
          tasks: 75,
          messages: 1000,
          aiUsage: 150,
        },
      });
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getWorkspaceStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateWorkspaceStatus', () => {
    it('should activate workspace (remove deletedAt)', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Acme Corp',
        deletedAt: new Date(),
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        deletedAt: null,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.updateWorkspaceStatus(
        'ws-1',
        true,
        'Reactivating',
        'admin-1',
      );

      expect(result.deletedAt).toBeNull();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should suspend workspace (set deletedAt)', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Acme Corp',
        deletedAt: null,
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        deletedAt: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.updateWorkspaceStatus(
        'ws-1',
        false,
        'Payment overdue',
        'admin-1',
      );

      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe('deleteWorkspace', () => {
    it('should permanently delete workspace', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Acme Corp',
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockPrismaService.workspace.delete.mockResolvedValue(mockWorkspace);

      const result = await service.deleteWorkspace('ws-1', 'admin-1');

      expect(result).toEqual({ message: 'Workspace deleted successfully' });
      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
      });
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteWorkspace('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkspaceActivity', () => {
    it('should return paginated activity logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'UPDATE',
          user: { id: 'user-1', email: 'user@example.com' },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.getWorkspaceActivity('ws-1', 1, 50);

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
