import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TotpService } from './totp.service';
import { EncryptionService } from './encryption.service';

describe('AuthService - TOTP/2FA Security', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let totpService: TotpService;
  let encryptionService: EncryptionService;
  let tokenService: TokenService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashed',
    totpSecret: null,
    totpEnabled: false,
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            totpRecoveryCode: {
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
              update: jest.fn(),
            },
            workspaceMember: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            workspace: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((operations) => {
              // Handle both callback and array format
              if (typeof operations === 'function') {
                return operations(module.get(PrismaService));
              }
              // Array of promises - just resolve them
              return Promise.all(operations);
            }),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn(() => ({ accessToken: 'access-token', expiresIn: 900 })),
            generateRefreshToken: jest.fn(() => Promise.resolve('refresh-token')),
            generateTempToken: jest.fn(() => 'temp-token'),
            validateTempToken: jest.fn(() => 'user-123'),
          },
        },
        {
          provide: TotpService,
          useValue: {
            generateSecret: jest.fn(() => ({
              secret: 'JBSWY3DPEHPK3PXP',
              otpauthUrl: 'otpauth://totp/NexaCRM:test@example.com?secret=JBSWY3DPEHPK3PXP',
            })),
            generateQrCodeUrl: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KG...')),
            verify: jest.fn(),
            generateRecoveryCodes: jest.fn(() => ['A3F9K-B2M7P', 'C5H1L-D6J3N', 'E7K9M-F8L4O']),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((plain) => `encrypted:${plain}`),
            decrypt: jest.fn((encrypted) => encrypted.replace('encrypted:', '')),
            hash: jest.fn((input) => `hash:${input}`),
            compareHash: jest.fn((input, hash) => `hash:${input}` === hash),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    totpService = module.get<TotpService>(TotpService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    tokenService = module.get<TokenService>(TokenService);
  });

  describe('enableTotp', () => {
    it('should encrypt totpSecret before storing', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      await authService.enableTotp('user-123');

      expect(encryptionService.encrypt).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
          totpEnabled: false,
        },
      });
    });

    it('should return plaintext secret to user (not encrypted)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await authService.enableTotp('user-123');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeUrl).toBe('data:image/png;base64,iVBORw0KG...');
    });
  });

  describe('confirmTotp', () => {
    it('should decrypt totpSecret before verification', async () => {
      const userWithEncryptedSecret = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithEncryptedSecret as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'deleteMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'createMany').mockResolvedValue({ count: 3 } as any);

      await authService.confirmTotp('user-123', '123456');

      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted:JBSWY3DPEHPK3PXP');
      expect(totpService.verify).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP', '123456');
    });

    it('should hash and store recovery codes', async () => {
      const userWithEncryptedSecret = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithEncryptedSecret as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'deleteMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'createMany').mockResolvedValue({ count: 3 } as any);

      const result = await authService.confirmTotp('user-123', '123456');

      expect(encryptionService.hash).toHaveBeenCalledWith('A3F9K-B2M7P');
      expect(encryptionService.hash).toHaveBeenCalledWith('C5H1L-D6J3N');
      expect(encryptionService.hash).toHaveBeenCalledWith('E7K9M-F8L4O');
      
      expect(prismaService.totpRecoveryCode.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-123', codeHash: 'hash:A3F9K-B2M7P' },
          { userId: 'user-123', codeHash: 'hash:C5H1L-D6J3N' },
          { userId: 'user-123', codeHash: 'hash:E7K9M-F8L4O' },
        ],
      });

      expect(result.recoveryCodes).toEqual(['A3F9K-B2M7P', 'C5H1L-D6J3N', 'E7K9M-F8L4O']);
    });

    it('should reject invalid TOTP codes', async () => {
      const userWithEncryptedSecret = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithEncryptedSecret as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(false);

      await expect(authService.confirmTotp('user-123', '999999')).rejects.toThrow(BadRequestException);
    });

    it('should delete old recovery codes before creating new ones', async () => {
      const userWithEncryptedSecret = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithEncryptedSecret as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'deleteMany').mockResolvedValue({ count: 3 } as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'createMany').mockResolvedValue({ count: 3 } as any);

      await authService.confirmTotp('user-123', '123456');

      expect(prismaService.totpRecoveryCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('loginWithTotp', () => {
    it('should decrypt totpSecret before verification', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
        totpEnabled: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.workspaceMember, 'findMany').mockResolvedValue([{ workspaceId: 'ws-123' }] as any);
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        id: 'ws-123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);

      await authService.loginWithTotp('temp-token', '123456', '127.0.0.1', 'test-agent');

      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted:JBSWY3DPEHPK3PXP');
      expect(totpService.verify).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP', '123456');
    });

    it('should reject invalid TOTP codes', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
        totpEnabled: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(false);

      await expect(
        authService.loginWithTotp('temp-token', '999999', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginWithRecoveryCode', () => {
    it('should verify recovery code using constant-time comparison', async () => {
      const userWithTotp = {
        ...mockUser,
        totpEnabled: true,
      };

      const recoveryCodes = [
        { id: 'rc-1', codeHash: 'hash:A3F9K-B2M7P', usedAt: null },
        { id: 'rc-2', codeHash: 'hash:C5H1L-D6J3N', usedAt: null },
      ];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'findMany').mockResolvedValue(recoveryCodes as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.workspaceMember, 'findMany').mockResolvedValue([{ workspaceId: 'ws-123' }] as any);
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        id: 'ws-123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);

      await authService.loginWithRecoveryCode('temp-token', 'A3F9K-B2M7P', '127.0.0.1', 'test-agent');

      expect(encryptionService.compareHash).toHaveBeenCalledWith('A3F9K-B2M7P', 'hash:A3F9K-B2M7P');
    });

    it('should mark recovery code as used after successful login', async () => {
      const userWithTotp = {
        ...mockUser,
        totpEnabled: true,
      };

      const recoveryCodes = [
        { id: 'rc-1', codeHash: 'hash:A3F9K-B2M7P', usedAt: null },
      ];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'findMany').mockResolvedValue(recoveryCodes as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.workspaceMember, 'findMany').mockResolvedValue([{ workspaceId: 'ws-123' }] as any);
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        id: 'ws-123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);

      await authService.loginWithRecoveryCode('temp-token', 'A3F9K-B2M7P', '127.0.0.1', 'test-agent');

      expect(prismaService.totpRecoveryCode.update).toHaveBeenCalledWith({
        where: { id: 'rc-1' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should reject invalid recovery codes', async () => {
      const userWithTotp = {
        ...mockUser,
        totpEnabled: true,
      };

      const recoveryCodes = [
        { id: 'rc-1', codeHash: 'hash:A3F9K-B2M7P', usedAt: null },
      ];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'findMany').mockResolvedValue(recoveryCodes as any);

      await expect(
        authService.loginWithRecoveryCode('temp-token', 'INVALID-CODE', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject already used recovery codes', async () => {
      const userWithTotp = {
        ...mockUser,
        totpEnabled: true,
      };

      const recoveryCodes = [
        { id: 'rc-1', codeHash: 'hash:A3F9K-B2M7P', usedAt: new Date() },
      ];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'findMany').mockResolvedValue([] as any); // Used codes filtered out

      await expect(
        authService.loginWithRecoveryCode('temp-token', 'A3F9K-B2M7P', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should normalize recovery code (remove spaces, uppercase)', async () => {
      const userWithTotp = {
        ...mockUser,
        totpEnabled: true,
      };

      const recoveryCodes = [
        { id: 'rc-1', codeHash: 'hash:A3F9K-B2M7P', usedAt: null },
      ];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'findMany').mockResolvedValue(recoveryCodes as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.workspaceMember, 'findMany').mockResolvedValue([{ workspaceId: 'ws-123' }] as any);
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        id: 'ws-123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);

      await authService.loginWithRecoveryCode('temp-token', ' a3f9k-b2m7p ', '127.0.0.1', 'test-agent');

      expect(encryptionService.compareHash).toHaveBeenCalledWith('A3F9K-B2M7P', 'hash:A3F9K-B2M7P');
    });
  });

  describe('disableTotp', () => {
    it('should decrypt totpSecret before verification', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
        totpEnabled: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'deleteMany').mockResolvedValue({ count: 3 } as any);

      await authService.disableTotp('user-123', '123456');

      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted:JBSWY3DPEHPK3PXP');
      expect(totpService.verify).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP', '123456');
    });

    it('should delete all recovery codes when disabling 2FA', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: 'encrypted:JBSWY3DPEHPK3PXP',
        totpEnabled: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithTotp as any);
      jest.spyOn(totpService, 'verify').mockReturnValue(true);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.totpRecoveryCode, 'deleteMany').mockResolvedValue({ count: 8 } as any);

      await authService.disableTotp('user-123', '123456');

      expect(prismaService.totpRecoveryCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });
});
