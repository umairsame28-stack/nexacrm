import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/roles.decorator';
import { CryptoService } from '../../common/utils/crypto.service';

@ApiTags('Webhooks')
@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookProcessor: WebhookProcessorService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /**
   * GET /webhooks/whatsapp
   * Meta verification handshake
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Meta webhook verification (hub challenge)' })
  async verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode !== 'subscribe') {
      return res.status(403).send('Invalid mode');
    }

    const settings = await this.prisma.workspaceSettings.findFirst({
      where: { wabVerifyToken: verifyToken },
    });

    if (!settings) {
      this.logger.warn({
        event: 'webhook_verification_failed',
        reason: 'no_workspace_found',
      });
      return res.status(403).send('Invalid verify token');
    }

    this.logger.log({
      event: 'webhook_verified',
      workspaceId: settings.workspaceId,
    });
    return res.status(200).send(challenge);
  }

  /**
   * POST /webhooks/whatsapp
   * Receive inbound events from Meta
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp Cloud API events' })
  async receive(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      this.logger.error({ event: 'webhook_rejected', reason: 'missing_signature' });
      throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    }

    const phoneNumberId = this.extractPhoneNumberId(body);
    if (!phoneNumberId) {
      this.logger.error({ event: 'webhook_rejected', reason: 'missing_phone_number_id' });
      throw new ForbiddenException('Invalid webhook payload: missing phone_number_id');
    }

    const isValid = await this.verifyHmacSignature(req, phoneNumberId, signature);
    if (!isValid) {
      this.logger.error({
        event: 'webhook_rejected',
        reason: 'invalid_signature',
        phoneNumberId,
      });
      throw new ForbiddenException('Invalid webhook signature');
    }

    this.logger.log({
      event: 'webhook_received',
      phoneNumberId,
      ip: req.ip,
    });

    this.webhookProcessor.processWebhook(body).catch((err) => {
      this.logger.error({
        event: 'webhook_processing_error',
        phoneNumberId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return { status: 'ok' };
  }

  private extractPhoneNumberId(body: Record<string, unknown>): string | null {
    const entry = (body.entry as unknown[])?.[0] as Record<string, unknown>;
    if (!entry) return null;

    const changes = (entry.changes as unknown[])?.[0] as Record<string, unknown>;
    if (!changes) return null;

    const value = changes.value as Record<string, unknown>;
    if (!value) return null;

    const metadata = value.metadata as Record<string, string> | undefined;
    return metadata?.phone_number_id ?? null;
  }

  private async verifyHmacSignature(
    req: Request,
    phoneNumberId: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const settings = await this.prisma.workspaceSettings.findFirst({
        where: { wabPhoneNumberId: phoneNumberId },
        select: { wabWebhookSecret: true, workspaceId: true },
      });

      if (!settings?.wabWebhookSecret) {
        this.logger.warn({
          event: 'webhook_verification_failed',
          reason: 'no_webhook_secret',
          phoneNumberId,
        });
        return false;
      }

      const expectedPrefix = 'sha256=';
      if (!signature.startsWith(expectedPrefix)) {
        return false;
      }

      const providedHash = signature.slice(expectedPrefix.length);
      const secret = this.crypto.decrypt(settings.wabWebhookSecret);

      const rawBody = (req as any).rawBody;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        this.logger.error({
          event: 'webhook_verification_failed',
          reason: 'missing_raw_body',
          phoneNumberId,
        });
        return false;
      }

      const computedHash = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const matches = timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(providedHash, 'hex'),
      );

      if (matches) {
        this.logger.log({
          event: 'webhook_signature_verified',
          workspaceId: settings.workspaceId,
          phoneNumberId,
        });
      }

      return matches;
    } catch (err) {
      this.logger.error({
        event: 'webhook_verification_error',
        phoneNumberId,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}
