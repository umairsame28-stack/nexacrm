import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailNotificationService } from '../notifications/email-notification.service';
import { CryptoService } from '../../common/utils/crypto.service';
import {
  UpdateWorkspaceProfileDto,
  UpdateWhatsappSettingsDto,
  UpdateAISettingsDto,
  UpdateSmtpSettingsDto,
  UpdateSecuritySettingsDto,
  CreateApiKeyDto,
  AuditLogFilterDto,
} from './dto/settings.dto';
import { buildPaginatedResult, cursorToId } from '../../common/utils/pagination.util';
import { randomBytes, createHash } from 'crypto';
import type { AuditAction } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailNotificationService,
    private readonly crypto: CryptoService,
  ) {}

  // ─── Workspace Profile ─────────────────────────────────────────────────────

  async getWorkspaceProfile(workspaceId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
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
      },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async updateWorkspaceProfile(workspaceId: string, dto: UpdateWorkspaceProfileDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      },
      select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, timezone: true, currency: true, language: true },
    });
  }

  async updateLogoUrl(workspaceId: string, logoUrl: string) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { logoUrl },
      select: { id: true, logoUrl: true },
    });
  }

  // ─── Full Settings (masked) ─────────────────────────────────────────────────

  async getSettings(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });
    if (!settings) throw new NotFoundException('Settings not found');

    // Mask all sensitive fields
    return {
      ...settings,
      wabAccessToken: settings.wabAccessToken ? '***' : null,
      wabWebhookSecret: settings.wabWebhookSecret ? '***' : null,
      aiApiKey: settings.aiApiKey ? '***' : null,
      smtpPassword: settings.smtpPassword ? '***' : null,
    };
  }

  // ─── WhatsApp Settings ──────────────────────────────────────────────────────

  async updateWhatsappSettings(workspaceId: string, dto: UpdateWhatsappSettingsDto) {
    const data: Record<string, unknown> = {};
    if (dto.wabPhoneNumberId !== undefined) data.wabPhoneNumberId = dto.wabPhoneNumberId;
    if (dto.wabAccessToken !== undefined) data.wabAccessToken = this.crypto.encrypt(dto.wabAccessToken);
    if (dto.wabWebhookSecret !== undefined) data.wabWebhookSecret = this.crypto.encrypt(dto.wabWebhookSecret);
    if (dto.wabVerifyToken !== undefined) data.wabVerifyToken = dto.wabVerifyToken;

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
      select: { id: true, wabPhoneNumberId: true, wabVerifyToken: true, updatedAt: true },
    });
  }

  async testWhatsappConnection(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });

    if (!settings?.wabAccessToken || !settings.wabPhoneNumberId) {
      return { connected: false, error: 'WhatsApp credentials not configured. Save your Phone Number ID and Access Token first.' };
    }

    try {
      const { default: axios } = await import('axios');
      const token = this.crypto.decrypt(settings.wabAccessToken);
      const phoneNumberId = settings.wabPhoneNumberId;

      // Use the phone number ID endpoint — the most reliable connectivity check
      // Requires whatsapp_business_messaging permission
      const response = await axios.get(
        `https://graph.facebook.com/v20.0/${phoneNumberId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { fields: 'display_phone_number,verified_name,code_verification_status,quality_rating' },
          timeout: 10_000,
        },
      );

      return {
        connected: true,
        phoneNumber: response.data.display_phone_number as string,
        displayName: response.data.verified_name as string,
        qualityRating: response.data.quality_rating as string,
      };
    } catch (err) {
      // Extract the real Meta API error message
      const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: number } } }; message?: string };
      const metaError = axiosErr?.response?.data?.error;

      if (metaError) {
        return {
          connected: false,
          error: `Meta API error ${metaError.code ?? ''}: ${metaError.message ?? 'Unknown error'}`,
        };
      }

      return {
        connected: false,
        error: axiosErr?.message ?? 'Unable to connect to WhatsApp API. Check your credentials and try again.',
      };
    }
  }

  /**
   * Test WhatsApp connection using provided credentials (NOT from database).
   * This allows users to test credentials before saving them.
   */
  async testWhatsappConnectionWithCredentials(dto: { wabAccessToken: string; wabPhoneNumberId: string }) {
    // Input validation
    if (!dto) {
      return { connected: false, error: 'No credentials provided in request body' };
    }

    if (!dto.wabAccessToken || !dto.wabPhoneNumberId) {
      return { connected: false, error: 'Both Access Token and Phone Number ID are required' };
    }

    // Validate token format
    if (!dto.wabAccessToken.startsWith('EAA')) {
      return {
        connected: false,
        error: 'Invalid token format. Meta tokens must start with "EAA". Are you using the temporary token from Quick Start instead of a permanent System User token?',
      };
    }

    if (dto.wabAccessToken.length < 100) {
      return {
        connected: false,
        error: 'Token appears too short. Permanent Meta tokens are typically 200+ characters. Please generate a new token from System Users.',
      };
    }

    try {
      const { default: axios } = await import('axios');
      
      const url = `https://graph.facebook.com/v20.0/${dto.wabPhoneNumberId}`;

      // Use the phone number ID endpoint — the most reliable connectivity check
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${dto.wabAccessToken}`,
          'User-Agent': 'NexaCRM/1.0',
        },
        params: { 
          fields: 'display_phone_number,verified_name,code_verification_status,quality_rating',
        },
        timeout: 15_000,
        validateStatus: () => true, // Don't throw on any status
      });

      if (response.status === 200 && response.data) {
        return {
          connected: true,
          phoneNumber: response.data.display_phone_number as string,
          displayName: response.data.verified_name as string,
          qualityRating: response.data.quality_rating as string,
        };
      }

      // Handle error response
      const errorData = response.data as { error?: { message?: string; code?: number; type?: string; fbtrace_id?: string } };
      
      if (errorData.error) {
        let friendlyError = `Meta API error ${errorData.error.code ?? response.status}`;
        
        if (errorData.error.message) {
          friendlyError += `: ${errorData.error.message}`;
        }

        // Add helpful hints for common errors
        if (errorData.error.code === 190) {
          friendlyError += '\n\n💡 This usually means your token has expired or is invalid. Generate a NEW permanent token from System Users.';
        } else if (errorData.error.code === 100) {
          friendlyError += '\n\n💡 Check that your Phone Number ID is correct (should be a 15-digit number from API Setup page).';
        } else if (errorData.error.code === 200) {
          friendlyError += '\n\n💡 Permission denied. Make sure your System User has both whatsapp_business_messaging and whatsapp_business_management permissions.';
        }

        return {
          connected: false,
          error: friendlyError,
        };
      }

      return {
        connected: false,
        error: `Unexpected response from Meta API (status ${response.status})`,
      };

    } catch (err) {
      const error = err as { message?: string; code?: string; response?: { status?: number; data?: unknown } };
      
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          connected: false,
          error: 'Connection timeout. Check your internet connection or try again.',
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          connected: false,
          error: 'Cannot reach Meta API. Check your network connection.',
        };
      }

      return {
        connected: false,
        error: error.message ?? 'Unknown error occurred while testing connection.',
      };
    }
  }

  // ─── AI Settings ────────────────────────────────────────────────────────────

  async updateAISettings(workspaceId: string, dto: UpdateAISettingsDto) {
    const data: Record<string, unknown> = {};
    if (dto.aiProvider !== undefined) data.aiProvider = dto.aiProvider;
    if (dto.aiApiKey !== undefined) data.aiApiKey = this.crypto.encrypt(dto.aiApiKey);
    if (dto.aiModel !== undefined) data.aiModel = dto.aiModel;

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
      select: { id: true, aiProvider: true, aiModel: true, updatedAt: true },
    });
  }

  async testAIConnection(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.aiApiKey || !settings.aiProvider) {
      return { connected: false, error: 'AI provider not configured' };
    }

    try {
      const apiKey = this.crypto.decrypt(settings.aiApiKey);
      const { default: axios } = await import('axios');

      if (settings.aiProvider === 'OPENAI') {
        await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return { connected: true, model: settings.aiModel ?? 'gpt-4o' };
      }

      if (settings.aiProvider === 'ANTHROPIC') {
        await axios.get('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        });
        return { connected: true, model: settings.aiModel ?? 'claude-3-5-sonnet-20241022' };
      }

      return { connected: true, model: settings.aiModel };
    } catch {
      return { connected: false, error: 'Unable to connect to AI provider' };
    }
  }

  // ─── SMTP Settings ──────────────────────────────────────────────────────────

  async updateSmtpSettings(workspaceId: string, dto: UpdateSmtpSettingsDto) {
    const data: Record<string, unknown> = {};
    if (dto.smtpHost !== undefined) data.smtpHost = dto.smtpHost;
    if (dto.smtpPort !== undefined) data.smtpPort = dto.smtpPort;
    if (dto.smtpUser !== undefined) data.smtpUser = dto.smtpUser;
    if (dto.smtpPassword !== undefined) data.smtpPassword = this.crypto.encrypt(dto.smtpPassword);
    if (dto.smtpFromEmail !== undefined) data.smtpFromEmail = dto.smtpFromEmail;
    if (dto.smtpFromName !== undefined) data.smtpFromName = dto.smtpFromName;

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
      select: { id: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpFromEmail: true, smtpFromName: true, updatedAt: true },
    });
  }

  async testSmtp(workspaceId: string, toEmail: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.smtpHost) {
      return { sent: false, error: 'SMTP not configured' };
    }

    try {
      const password = settings.smtpPassword ? this.crypto.decrypt(settings.smtpPassword) : undefined;

      // Create a one-off transporter for the workspace's SMTP settings
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort ?? 587,
        secure: (settings.smtpPort ?? 587) === 465,
        auth: settings.smtpUser
          ? { user: settings.smtpUser, pass: password }
          : undefined,
      });

      const fromEmail = settings.smtpFromEmail ?? 'noreply@nexacrm.io';
      const fromName = settings.smtpFromName ?? 'NexaCRM';

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: 'NexaCRM — SMTP Test',
        html: '<p>Your SMTP configuration is working correctly!</p>',
        text: 'Your SMTP configuration is working correctly!',
      });

      return { sent: true };
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ─── Security Settings ──────────────────────────────────────────────────────

  async updateSecuritySettings(workspaceId: string, dto: UpdateSecuritySettingsDto) {
    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...dto },
      update: {
        ...(dto.enforce2FA !== undefined && { enforce2FA: dto.enforce2FA }),
        ...(dto.sessionTimeoutMins !== undefined && { sessionTimeoutMins: dto.sessionTimeoutMins }),
        ...(dto.ipWhitelist !== undefined && { ipWhitelist: dto.ipWhitelist }),
      },
      select: { id: true, enforce2FA: true, sessionTimeoutMins: true, ipWhitelist: true, updatedAt: true },
    });
  }

  // ─── API Keys ───────────────────────────────────────────────────────────────

  async listApiKeys(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(workspaceId: string, dto: CreateApiKeyDto, creatorId: string) {
    // Generate a cryptographically secure key
    const rawKey = `nexacrm_sk_live_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 20);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspaceId,
        name: dto.name,
        keyHash,
        keyPrefix,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdById: creatorId,
      },
    });

    // Return the full key ONLY on creation — never again
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async revokeApiKey(workspaceId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, workspaceId, revokedAt: null },
    });
    if (!key) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async validateApiKey(rawKey: string): Promise<{ workspaceId: string } | null> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      select: { workspaceId: true, revokedAt: true, expiresAt: true },
    });

    if (!apiKey || apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update lastUsedAt asynchronously (non-blocking)
    this.prisma.apiKey
      .updateMany({ where: { keyHash }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return { workspaceId: apiKey.workspaceId };
  }

  // ─── Audit Log ──────────────────────────────────────────────────────────────

  async getAuditLog(workspaceId: string, filter: AuditLogFilterDto) {
    const limit = Math.min(filter.limit ?? 25, 100);
    const cursorId = cursorToId(filter.cursor);

    const where = {
      workspaceId,
      ...(filter.userId && { userId: filter.userId }),
      ...(filter.action && { action: filter.action as AuditAction }),
      ...(filter.resource && { resource: filter.resource }),
      ...(filter.from || filter.to
        ? {
            createdAt: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(logs, limit, total);
  }
}
