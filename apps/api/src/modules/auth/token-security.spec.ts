import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

describe('TokenService - Refresh Token Security', () => {
  let tokenService: TokenService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockRefreshToken = {
    id: 'token-123',
    userId: 'user-123',
    token: createHash('sha256').update('plaintext-token').digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.refreshExpiryDays') return 7;
              if (key === 'jwt.accessSecret') return 'test-secret';
              if (key === 'jwt.accessExpiry') return '15m';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('generateRefreshToken', () => {
    it('should hash token with SHA-256 before storing', async () => {
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);

      const token = await tokenService.generateRefreshToken('user-123', '127.0.0.1', 'test-agent');

      expect(token).toBeTruthy();
      expect(token).toHaveLength(128); // 64 bytes in hex = 128 characters
      
      // Verify that the stored token is a hash
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          token: expect.any(String), // Should be hash, not plaintext
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      });

      // Verify the stored value is not the plaintext token
      const createCall = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.token).not.toBe(token);
      expect(createCall.data.token).toHaveLength(64); // SHA-256 hash is 64 hex characters
    });

    it('should use config for expiry time', async () => {
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'jwt.refreshExpiryDays') return 30; // Custom expiry
        return null;
      });

      await tokenService.generateRefreshToken('user-123');

      const createCall = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      const expiresAt = new Date(createCall.data.expiresAt);
      const now = new Date();
      const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('should default to 7 days if config not set', async () => {
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);

      await tokenService.generateRefreshToken('user-123');

      const createCall = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      const expiresAt = new Date(createCall.data.expiresAt);
      const now = new Date();
      const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });
  });

  describe('rotateRefreshToken - Reuse Detection', () => {
    it('should hash incoming token before lookup', async () => {
      const plainToken = 'plaintext-token';
      const hashedToken = createHash('sha256').update(plainToken).digest('hex');

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(prismaService.refreshToken, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue({} as any);

      await tokenService.rotateRefreshToken(plainToken, '127.0.0.1', 'test-agent');

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashedToken },
      });
    });

    it('should revoke all user tokens on reuse detection', async () => {
      const revokedToken = {
        ...mockRefreshToken,
        revokedAt: new Date(), // Already revoked - indicates reuse
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(revokedToken as any);
      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 5 } as any);

      await expect(
        tokenService.rotateRefreshToken('plaintext-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        tokenService.rotateRefreshToken('plaintext-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow('Refresh token reuse detected');

      // Verify all tokens were revoked
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should successfully rotate valid token', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(prismaService.refreshToken, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);

      const result = await tokenService.rotateRefreshToken('plaintext-token', '127.0.0.1', 'test-agent');

      expect(result.userId).toBe('user-123');
      expect(result.newToken).toBeTruthy();
      
      // Old token should be revoked
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should reject expired tokens', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(expiredToken as any);

      await expect(
        tokenService.rotateRefreshToken('plaintext-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        tokenService.rotateRefreshToken('plaintext-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow('Refresh token has expired');
    });

    it('should reject invalid tokens', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(
        tokenService.rotateRefreshToken('invalid-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        tokenService.rotateRefreshToken('invalid-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should hash token before revocation', async () => {
      const plainToken = 'plaintext-token';
      const hashedToken = createHash('sha256').update(plainToken).digest('hex');

      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 1 } as any);

      await tokenService.revokeRefreshToken(plainToken);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: hashedToken },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all active tokens for a user', async () => {
      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 3 } as any);

      await tokenService.revokeAllUserTokens('user-123');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('Security Properties', () => {
    it('should generate cryptographically random tokens', async () => {
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);

      const token1 = await tokenService.generateRefreshToken('user-123');
      const token2 = await tokenService.generateRefreshToken('user-123');

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(128);
      expect(token2).toHaveLength(128);
    });

    it('should never store plaintext tokens', async () => {
      const createSpy = jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken as any);

      const plaintextToken = await tokenService.generateRefreshToken('user-123');

      const storedValue = createSpy.mock.calls[0][0].data.token;
      expect(storedValue).not.toBe(plaintextToken);
      expect(storedValue).toHaveLength(64); // SHA-256 hash length
    });
  });
});
