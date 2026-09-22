import { Test, TestingModule } from '@nestjs/testing';
import { AdminSystemService } from './admin-system.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AdminSystemService', () => {
  let service: AdminSystemService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    workspace: {
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
    message: {
      count: jest.fn(),
    },
    refreshToken: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    aiUsageLog: {
      count: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSystemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminSystemService>(AdminSystemService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemStats', () => {
    it('should return comprehensive system statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(1000) // total users
        .mockResolvedValueOnce(900) // active users
        .mockResolvedValueOnce(50) // suspended users
        .mockResolvedValueOnce(3) // super admins
        .mockResolvedValueOnce(150); // recent logins

      mockPrismaService.workspace.count
        .mockResolvedValueOnce(100) // total workspaces
        .mockResolvedValueOnce(95); // active workspaces

      mockPrismaService.contact.count.mockResolvedValue(50000);
      mockPrismaService.lead.count.mockResolvedValue(10000);
      mockPrismaService.deal.count.mockResolvedValue(5000);
      mockPrismaService.conversation.count.mockResolvedValue(75000);
      mockPrismaService.message.count.mockResolvedValue(300000);

      const result = await service.getSystemStats();

      expect(result).toMatchObject({
        users: {
          total: 1000,
          active: 900,
          suspended: 50,
          superAdmins: 3,
          recentLogins: 150,
        },
        workspaces: {
          total: 100,
          active: 95,
          suspended: 5,
        },
        data: {
          contacts: 50000,
          leads: 10000,
          deals: 5000,
          conversations: 75000,
          messages: 300000,
        },
      });
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent audit logs with user info', async () => {
      const mockActivities = [
        {
          id: 'log-1',
          action: 'LOGIN',
          user: {
            id: 'user-1',
            email: 'user@example.com',
            systemRole: 'USER',
          },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockActivities);

      const result = await service.getRecentActivity(50);

      expect(result).toEqual(mockActivities);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('getFailedLogins', () => {
    it('should return failed login attempts with suspicious activity', async () => {
      const mockFailedLogins = [
        {
          id: 'log-1',
          action: 'LOGIN_FAILED',
          user: { id: 'user-1', email: 'hacker@evil.com' },
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          action: 'LOGIN_FAILED',
          user: { id: 'user-1', email: 'hacker@evil.com' },
          createdAt: new Date(),
        },
        {
          id: 'log-3',
          action: 'LOGIN_FAILED',
          user: { id: 'user-1', email: 'hacker@evil.com' },
          createdAt: new Date(),
        },
        {
          id: 'log-4',
          action: 'LOGIN_FAILED',
          user: { id: 'user-1', email: 'hacker@evil.com' },
          createdAt: new Date(),
        },
        {
          id: 'log-5',
          action: 'LOGIN_FAILED',
          user: { id: 'user-1', email: 'hacker@evil.com' },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockFailedLogins);

      const result = await service.getFailedLogins(24, 100);

      expect(result.recentFailures).toEqual(mockFailedLogins);
      expect(result.suspiciousActivity).toContainEqual({
        email: 'hacker@evil.com',
        failureCount: 5,
      });
      expect(result.totalFailures).toBe(5);
      expect(result.timeRange).toBe('24 hours');
    });

    it('should handle failed logins without user info', async () => {
      const mockFailedLogins = [
        {
          id: 'log-1',
          action: 'LOGIN_FAILED',
          user: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockFailedLogins);

      const result = await service.getFailedLogins(24, 100);

      expect(result.recentFailures).toEqual(mockFailedLogins);
    });
  });

  describe('getUserGrowth', () => {
    it('should return user growth statistics', async () => {
      mockPrismaService.user.count.mockResolvedValue(50);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { date: new Date('2024-01-01'), count: BigInt(10) },
        { date: new Date('2024-01-02'), count: BigInt(15) },
      ]);

      const result = await service.getUserGrowth(30);

      expect(result).toMatchObject({
        totalNewUsers: 50,
        period: '30 days',
        dailyBreakdown: [
          { date: new Date('2024-01-01'), count: 10 },
          { date: new Date('2024-01-02'), count: 15 },
        ],
      });
    });
  });

  describe('getWorkspaceGrowth', () => {
    it('should return workspace growth statistics', async () => {
      mockPrismaService.workspace.count.mockResolvedValue(20);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { date: new Date('2024-01-01'), count: BigInt(5) },
        { date: new Date('2024-01-02'), count: BigInt(7) },
      ]);

      const result = await service.getWorkspaceGrowth(30);

      expect(result).toMatchObject({
        totalNewWorkspaces: 20,
        period: '30 days',
        dailyBreakdown: [
          { date: new Date('2024-01-01'), count: 5 },
          { date: new Date('2024-01-02'), count: 7 },
        ],
      });
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health metrics', async () => {
      mockPrismaService.refreshToken.count.mockResolvedValue(150);
      mockPrismaService.task.count.mockResolvedValue(500);
      mockPrismaService.message.count.mockResolvedValue(25);
      mockPrismaService.aiUsageLog.count.mockResolvedValue(1000);

      const result = await service.getSystemHealth();

      expect(result).toMatchObject({
        activeSessions: 150,
        pendingTasks: 500,
        failedMessages: 25,
        aiUsageToday: 1000,
        status: 'healthy',
      });
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getSuperAdmins', () => {
    it('should return list of all super admins', async () => {
      const mockSuperAdmins = [
        {
          id: 'admin-1',
          email: 'admin1@nexacrm.com',
          firstName: 'Admin',
          lastName: 'One',
          systemRole: 'SUPER_ADMIN',
        },
        {
          id: 'admin-2',
          email: 'admin2@nexacrm.com',
          firstName: 'Admin',
          lastName: 'Two',
          systemRole: 'SUPER_ADMIN',
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockSuperAdmins);

      const result = await service.getSuperAdmins();

      expect(result).toEqual(mockSuperAdmins);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { systemRole: 'SUPER_ADMIN' },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
