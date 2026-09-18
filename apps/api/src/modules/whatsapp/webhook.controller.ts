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

    // Find workspace by verify token
    const settings = await this.prisma.workspaceSettings.findFirst({
      where: { wabVerifyToken: verifyToken },
    });

    if (!settings) {
      this.logger.warn(`Webhook verification failed: no workspace with verify token ${verifyToken}`);
      return res.status(403).send('Invalid verify token');
    }

    this.logger.log(`Webhook verified for workspace ${settings.workspaceId}`);
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
    this.logger.log(`📥 Webhook POST received from ${req.ip}`);
    this.logger.debug(`Webhook payload: ${JSON.stringify(body).substring(0, 500)}...`);

    // Validate HMAC signature
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      this.logger.error('❌ Missing X-Hub-Signature-256 header');
      throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    }

    this.logger.log('🔐 Verifying HMAC signature...');
    const isValid = await this.verifyHmacSignature(body, signature);
    if (!isValid) {
      this.logger.error('❌ Invalid webhook signature');
      throw new ForbiddenException('Invalid webhook signature');
    }

    this.logger.log('✅ Signature verified, processing webhook...');

    // Process asynchronously — always return 200 immediately to Meta
    this.webhookProcessor.processWebhook(body).catch((err) => {
      this.logger.error(`❌ Webhook processing error: ${String(err)}`);
    });

    return { status: 'ok' };
  }

  private async verifyHmacSignature(
    body: Record<string, unknown>,
    signature: string,
  ): Promise<boolean> {
    try {
      // Find the first workspace with a webhook secret to verify
      // In production each webhook URL is workspace-specific
      const allSettings = await this.prisma.workspaceSettings.findMany({
        where: { wabWebhookSecret: { not: null } },
        select: { wabWebhookSecret: true, workspaceId: true },
        take: 10,
      });

      this.logger.log(`🔍 Found ${allSettings.length} workspace(s) with webhook secret configured`);

      const rawBody = JSON.stringify(body);
      const expectedPrefix = 'sha256=';

      if (!signature.startsWith(expectedPrefix)) {
        this.logger.error('❌ Signature does not start with sha256=');
        return false;
      }
      const providedHash = signature.slice(expectedPrefix.length);

      for (const settings of allSettings) {
        if (!settings.wabWebhookSecret) continue;
        const secret = this.crypto.decrypt(settings.wabWebhookSecret);
        const computedHash = createHmac('sha256', secret)
          .update(rawBody)
          .digest('hex');

        try {
          const matches = timingSafeEqual(
            Buffer.from(computedHash, 'hex'),
            Buffer.from(providedHash, 'hex'),
          );
          if (matches) {
            this.logger.log(`✅ Signature matched for workspace ${settings.workspaceId}`);
            return true;
          }
        } catch {
          continue;
        }
      }
      this.logger.error('❌ Signature did not match any workspace');
      return false;
    } catch (err) {
      this.logger.error(`❌ HMAC verification error: ${String(err)}`);
      return false;
    }
  }
}
