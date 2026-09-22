import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { addDays, addMinutes } from 'date-fns';

interface TokenPair {
  accessToken: string;
  expiresIn: number;
}

interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generates an access token.
   * Uses RS256 with private key when JWT_PRIVATE_KEY is set; falls back to HS256.
   */
  generateAccessToken(user: JwtPayload): TokenPair {
    const privateKey = this.config.get<string>('jwt.privateKey') ?? '';
    const secret = this.config.get<string>('jwt.accessSecret') ?? '';
    const expiresIn = this.config.get<string>('jwt.accessExpiry') ?? '15m';

    const payload: Record<string, unknown> = {
      sub: user.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    let token: string;

    if (privateKey) {
      // RS256 — sign with the PEM private key
      token = this.jwtService.sign(payload, {
        algorithm: 'RS256',
        secret: privateKey,
        expiresIn: expiresIn as unknown as number,
      });
    } else {
      // HS256 fallback
      token = this.jwtService.sign(payload, {
        algorithm: 'HS256',
        secret,
        expiresIn: expiresIn as unknown as number,
      });
    }

    return { accessToken: token, expiresIn: this.parseExpiryToSeconds(expiresIn) };
  }

  async generateRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = addDays(new Date(), 7);

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt, ipAddress, userAgent },
    });

    return token;
  }

  async rotateRefreshToken(
    oldToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ userId: string; newToken: string }> {
    const existing = await this.prisma.refreshToken.findUnique({ where: { token: oldToken } });

    if (!existing) throw new UnauthorizedException('Invalid refresh token');
    if (existing.revokedAt) throw new UnauthorizedException('Refresh token has been revoked');
    if (existing.expiresAt < new Date()) throw new UnauthorizedException('Refresh token has expired');

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const newToken = await this.generateRefreshToken(existing.userId, ipAddress, userAgent);
    return { userId: existing.userId, newToken };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Short-lived temp token for the TOTP two-step login flow.
   */
  generateTempToken(userId: string): string {
    const secret = this.config.get<string>('jwt.accessSecret');
    
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    return this.jwtService.sign(
      { sub: userId, type: 'totp_pending' },
      { algorithm: 'HS256', secret, expiresIn: '5m' as unknown as number },
    );
  }

  validateTempToken(token: string): string {
    const secret = this.config.get<string>('jwt.accessSecret');
    
    if (!secret) {
      throw new UnauthorizedException('JWT_ACCESS_SECRET is not configured');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; type: string }>(token, { secret });
      if (payload.type !== 'totp_pending') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired temp token');
    }
  }

  generatePasswordResetToken(): { token: string; expiresAt: Date } {
    return {
      token: randomBytes(32).toString('hex'),
      expiresAt: addMinutes(new Date(), 60),
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
