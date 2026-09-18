import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TotpService } from './totp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { toSlug, uniqueSlug } from '../../common/utils/slug.util';
import type { User, Workspace, WorkspaceMemberRole } from '@prisma/client';

interface LoginResult {
  accessToken?: string;
  expiresIn?: number;
  refreshToken?: string;
  user?: Partial<User>;
  workspace?: Partial<Workspace>;
  requiresTOTP?: boolean;
  tempToken?: string;
}

interface RegisterResult {
  user: Partial<User>;
  workspace: Partial<Workspace>;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly totpService: TotpService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<RegisterResult> {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    // Build unique workspace slug
    let slug = toSlug(dto.workspaceName);
    let suffix = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = uniqueSlug(toSlug(dto.workspaceName), suffix++);
    }

    // Create user + workspace in a transaction
    const { user, workspace } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'ACTIVE',
          emailVerified: false,
        },
      });

      const newWorkspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          slug,
          timezone: dto.timezone ?? 'UTC',
          members: {
            create: {
              userId: newUser.id,
              role: 'OWNER' as WorkspaceMemberRole,
              isActive: true,
            },
          },
          settings: {
            create: {},
          },
        },
      });

      return { user: newUser, workspace: newWorkspace };
    });

    // Seed default pipelines for the new workspace
    await this.seedDefaultPipelines(workspace.id);

    // Generate tokens
    const { accessToken, expiresIn } = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, ipAddress, userAgent);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        ipAddress,
        userAgent,
      },
    });

    this.eventEmitter.emit('user.registered', { userId: user.id, workspaceId: workspace.id });

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      accessToken,
      expiresIn,
      refreshToken,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const isPasswordValid = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed attempt
      const workspace = await this.prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true },
      });
      if (workspace) {
        await this.prisma.auditLog.create({
          data: {
            workspaceId: workspace.workspaceId,
            userId: user.id,
            action: 'LOGIN_FAILED',
            resource: 'auth',
            ipAddress,
            userAgent,
          },
        });
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // If TOTP enabled, return a temp token instead of full auth
    if (user.totpEnabled) {
      const tempToken = this.tokenService.generateTempToken(user.id);
      return {
        requiresTOTP: true,
        tempToken,
        user: { id: user.id, firstName: user.firstName },
      };
    }

    const { accessToken, expiresIn } = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, ipAddress, userAgent);

    const workspaces = await this.prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      select: { workspaceId: true },
      take: 1,
    });

    const workspace = workspaces[0]
      ? await this.prisma.workspace.findUnique({ where: { id: workspaces[0].workspaceId } })
      : null;

    return {
      accessToken,
      expiresIn,
      refreshToken,
      requiresTOTP: false,
      user: { id: user.id, firstName: user.firstName, email: user.email, lastName: user.lastName },
      workspace: workspace ? { id: workspace.id, name: workspace.name, slug: workspace.slug } : undefined,
    };
  }

  async loginWithTotp(tempToken: string, code: string, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const userId = this.tokenService.validateTempToken(tempToken);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new UnauthorizedException('Invalid session');
    }

    const isValid = this.totpService.verify(user.totpSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const { accessToken, expiresIn } = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, ipAddress, userAgent);

    // Resolve workspace
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      select: { workspaceId: true },
      take: 1,
    });
    const workspace = memberships[0]
      ? await this.prisma.workspace.findUnique({ where: { id: memberships[0].workspaceId } })
      : null;

    return {
      accessToken,
      expiresIn,
      refreshToken,
      requiresTOTP: false,
      user: { id: user.id, firstName: user.firstName, email: user.email, lastName: user.lastName },
      workspace: workspace ? { id: workspace.id, name: workspace.name, slug: workspace.slug } : undefined,
    };
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; expiresIn: number; newRefreshToken: string }> {
    const { userId, newToken } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      ipAddress,
      userAgent,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    const { accessToken, expiresIn } = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return { accessToken, expiresIn, newRefreshToken: newToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async forgotPassword(email: string): Promise<void> {
    // Always succeed to prevent email enumeration
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return;
    }

    const { token, expiresAt } = this.tokenService.generatePasswordResetToken();

    // Get user's workspace
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const workspaceId = workspaceMember?.workspaceId ?? user.id;

    // Store token in a cache-like manner via user metadata or a dedicated table
    // For simplicity, we store it in the user record via a dedicated field stored as a JSON metadata in auditLog
    // In production, use a dedicated password_reset_tokens table
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        userId: user.id,
        action: 'SETTINGS_CHANGED',
        resource: 'password_reset',
        resourceId: token,
        newData: { token, expiresAt: expiresAt.toISOString() },
      },
    });

    this.eventEmitter.emit('auth.password_reset_requested', {
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
      workspaceId,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find the valid reset token in audit logs
    const record = await this.prisma.auditLog.findFirst({
      where: {
        action: 'SETTINGS_CHANGED',
        resource: 'password_reset',
        resourceId: token,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !record.newData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const data = record.newData as { token: string; expiresAt: string };
    if (new Date(data.expiresAt) < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    if (!record.userId) {
      throw new BadRequestException('Invalid reset token');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      // Revoke all refresh tokens to force re-login
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      // Invalidate the token by clearing its data
      this.prisma.auditLog.update({
        where: { id: record.id },
        data: { newData: { token, expiresAt: new Date(0).toISOString(), used: true } },
      }),
    ]);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        totpEnabled: true,
        workspaceMembers: {
          where: { isActive: true },
          select: {
            role: true,
            workspace: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      workspaces: user.workspaceMembers.map((m) => ({
        ...m.workspace,
        role: m.role,
      })),
      workspaceMembers: undefined,
    };
  }

  async enableTotp(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { secret, otpauthUrl } = this.totpService.generateSecret(user.email);
    const qrCodeUrl = await this.totpService.generateQrCodeUrl(otpauthUrl);

    // Store secret temporarily (not enabled until confirmed)
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });

    return { secret, qrCodeUrl };
  }

  async confirmTotp(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new BadRequestException('TOTP setup not initiated');
    }

    const isValid = this.totpService.verify(user.totpSecret, code);
    if (!isValid) {
      throw new BadRequestException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    const recoveryCodes = this.totpService.generateRecoveryCodes();
    return { recoveryCodes };
  }

  async disableTotp(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret || !user.totpEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = this.totpService.verify(user.totpSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Seeds a default lead pipeline and deal pipeline when a new workspace is created.
   * This ensures the leads/deals Kanban is immediately usable after registration.
   */
  private async seedDefaultPipelines(workspaceId: string): Promise<void> {
    try {
      // Default lead pipeline
      const leadPipeline = await this.prisma.pipeline.create({
        data: {
          workspaceId,
          name: 'Sales Pipeline',
          isDefault: true,
          sortOrder: 0,
          stages: {
            create: [
              { name: 'New',         color: '#6366f1', sortOrder: 0, probability: 10 },
              { name: 'Contacted',   color: '#8b5cf6', sortOrder: 1, probability: 30 },
              { name: 'Qualified',   color: '#f59e0b', sortOrder: 2, probability: 60 },
              { name: 'Proposal',    color: '#10b981', sortOrder: 3, probability: 80 },
            ],
          },
        },
      });

      // Default deal pipeline
      await this.prisma.dealPipeline.create({
        data: {
          workspaceId,
          name: 'Enterprise',
          isDefault: true,
          currency: 'USD',
          stages: {
            create: [
              { name: 'Discovery',    color: '#6366f1', sortOrder: 0, probability: 20 },
              { name: 'Proposal',     color: '#f59e0b', sortOrder: 1, probability: 50 },
              { name: 'Negotiation',  color: '#8b5cf6', sortOrder: 2, probability: 75 },
              { name: 'Contract',     color: '#10b981', sortOrder: 3, probability: 90 },
            ],
          },
        },
      });

      // Default tags
      await this.prisma.tag.createMany({
        data: [
          { workspaceId, name: 'VIP',        color: '#f59e0b' },
          { workspaceId, name: 'Hot Lead',   color: '#ef4444' },
          { workspaceId, name: 'Follow-up',  color: '#10b981' },
          { workspaceId, name: 'Enterprise', color: '#6366f1' },
        ],
        skipDuplicates: true,
      });
    } catch {
      // Non-critical — log and continue (workspace was already created)
    }
  }
}
