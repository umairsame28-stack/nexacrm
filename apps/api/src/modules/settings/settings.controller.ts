import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  UpdateWorkspaceProfileDto,
  UpdateWhatsappSettingsDto,
  TestWhatsappDto,
  UpdateAISettingsDto,
  UpdateSmtpSettingsDto,
  UpdateSecuritySettingsDto,
  CreateApiKeyDto,
  AuditLogFilterDto,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Settings')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Global settings (masked) ───────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all workspace settings (sensitive fields masked)' })
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getSettings(user.workspaceId);
  }

  // ─── Workspace Profile ──────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get workspace profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getWorkspaceProfile(user.workspaceId);
  }

  @Patch('profile')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Update workspace profile' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceProfileDto,
  ) {
    return this.settingsService.updateWorkspaceProfile(user.workspaceId, dto);
  }

  // ─── WhatsApp ───────────────────────────────────────────────────────────────

  @Get('whatsapp/status')
  @ApiOperation({ summary: 'Get WhatsApp connection status' })
  async getWhatsappStatus(@CurrentUser() user: AuthenticatedUser) {
    const settings = await this.settingsService.getSettings(user.workspaceId);
    const hasCredentials = !!(settings.wabPhoneNumberId && settings.wabAccessToken);
    
    return {
      connected: hasCredentials,
      phoneNumberId: settings.wabPhoneNumberId || null,
      configured: hasCredentials,
    };
  }

  @Get('whatsapp/webhook-health')
  @ApiOperation({ summary: 'Get webhook health status' })
  async getWebhookHealth(@CurrentUser() user: AuthenticatedUser) {
    // Check for recent webhook activity (messages received in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentInbound = await this.prisma.message.findFirst({
      where: {
        workspaceId: user.workspaceId,
        direction: 'INBOUND',
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Check if webhook secret and verify token are configured
    const settings = await this.settingsService.getSettings(user.workspaceId);
    const hasCredentials = !!(settings.wabWebhookSecret && settings.wabVerifyToken);

    // Check if we've EVER received any inbound message (proves webhook was set up at some point)
    const anyInboundEver = await this.prisma.message.findFirst({
      where: {
        workspaceId: user.workspaceId,
        direction: 'INBOUND',
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      webhookConfigured: hasCredentials && !!anyInboundEver, // Only "configured" if we've received at least one message
      lastWebhookReceived: anyInboundEver?.createdAt || null,
      isHealthy: !!recentInbound, // Healthy only if recently active
      webhookUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/webhooks/whatsapp`,
      credentialsSaved: hasCredentials, // Separate flag for credentials
    };
  }

  @Patch('whatsapp')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Update WhatsApp integration settings' })
  updateWhatsapp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWhatsappSettingsDto,
  ) {
    return this.settingsService.updateWhatsappSettings(user.workspaceId, dto);
  }

  @Post('whatsapp/test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Test WhatsApp API connectivity with provided credentials' })
  testWhatsapp(@Body() dto: TestWhatsappDto) {
    return this.settingsService.testWhatsappConnectionWithCredentials(dto);
  }

  // ─── AI Provider ────────────────────────────────────────────────────────────

  @Patch('ai')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Update AI provider settings' })
  updateAI(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAISettingsDto,
  ) {
    return this.settingsService.updateAISettings(user.workspaceId, dto);
  }

  @Post('ai/test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Test AI provider connectivity' })
  testAI(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.testAIConnection(user.workspaceId);
  }

  // ─── SMTP ───────────────────────────────────────────────────────────────────

  @Patch('smtp')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Update SMTP settings' })
  updateSmtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSmtpSettingsDto,
  ) {
    return this.settingsService.updateSmtpSettings(user.workspaceId, dto);
  }

  @Post('smtp/test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Send a test email via configured SMTP' })
  testSmtp(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.testSmtp(user.workspaceId, user.email);
  }

  // ─── Security ───────────────────────────────────────────────────────────────

  @Patch('security')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Update security settings' })
  updateSecurity(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSecuritySettingsDto,
  ) {
    return this.settingsService.updateSecuritySettings(user.workspaceId, dto);
  }

  // ─── API Keys ───────────────────────────────────────────────────────────────

  @Get('api-keys')
  @ApiOperation({ summary: 'List workspace API keys' })
  listApiKeys(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.listApiKeys(user.workspaceId);
  }

  @Post('api-keys')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Create a new API key — key returned only once' })
  createApiKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.settingsService.createApiKey(user.workspaceId, dto, user.id);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER')
  @ApiOperation({ summary: 'Revoke an API key' })
  revokeApiKey(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.settingsService.revokeApiKey(user.workspaceId, id);
  }

  // ─── Audit Log ──────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Get paginated audit log' })
  getAuditLog(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: AuditLogFilterDto,
  ) {
    return this.settingsService.getAuditLog(user.workspaceId, filter);
  }
}
