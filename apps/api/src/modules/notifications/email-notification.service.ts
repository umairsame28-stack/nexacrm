import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/utils/crypto.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP not configured in environment — will attempt workspace settings');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  private async createWorkspaceTransporter(workspaceId?: string): Promise<nodemailer.Transporter | null> {
    if (!workspaceId) {
      return this.transporter;
    }

    try {
      const settings = await this.prisma.workspaceSettings.findUnique({
        where: { workspaceId },
        select: {
          smtpHost: true,
          smtpPort: true,
          smtpUser: true,
          smtpPassword: true,
          smtpFromEmail: true,
          smtpFromName: true,
        },
      });

      if (!settings?.smtpHost) {
        this.logger.warn(`No workspace SMTP settings found for ${workspaceId}, falling back to global`);
        return this.transporter;
      }

      const password = settings.smtpPassword ? this.crypto.decrypt(settings.smtpPassword) : undefined;

      return nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort ?? 587,
        secure: (settings.smtpPort ?? 587) === 465,
        auth: settings.smtpUser
          ? { user: settings.smtpUser, pass: password }
          : undefined,
      });
    } catch (error) {
      this.logger.error(`Failed to create workspace transporter: ${error}`);
      return this.transporter;
    }
  }

  async sendEmail(opts: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    workspaceId?: string;
  }): Promise<boolean> {
    const transporter = await this.createWorkspaceTransporter(opts.workspaceId);
    
    if (!transporter) {
      this.logger.warn(`Cannot send email to ${opts.to} — SMTP not configured`);
      return false;
    }

    try {
      // Get workspace-specific from info if available
      let from: string;
      if (opts.workspaceId) {
        const settings = await this.prisma.workspaceSettings.findUnique({
          where: { workspaceId: opts.workspaceId },
          select: { smtpFromEmail: true, smtpFromName: true },
        });
        const fromEmail = settings?.smtpFromEmail ?? this.config.get('SMTP_FROM_EMAIL', 'noreply@nexacrm.io');
        const fromName = settings?.smtpFromName ?? this.config.get('SMTP_FROM_NAME', 'NexaCRM');
        from = `"${fromName}" <${fromEmail}>`;
      } else {
        from = `"${this.config.get('SMTP_FROM_NAME', 'NexaCRM')}" <${this.config.get('SMTP_FROM_EMAIL', 'noreply@nexacrm.io')}>`;
      }

      await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${String(err)}`);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, appUrl: string, workspaceId?: string): Promise<void> {
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your NexaCRM password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Reset your NexaCRM password: ${resetUrl}`,
      workspaceId,
    });
  }

  async sendInvitationEmail(
    email: string,
    workspaceName: string,
    invitationToken: string,
    appUrl: string,
  ): Promise<void> {
    const acceptUrl = `${appUrl}/invitations/accept?token=${invitationToken}`;
    await this.sendEmail({
      to: email,
      subject: `You've been invited to ${workspaceName} on NexaCRM`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're Invited!</h2>
          <p>You've been invited to join <strong>${workspaceName}</strong> on NexaCRM.</p>
          <p><a href="${acceptUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>
          <p>This invitation expires in 48 hours.</p>
        </div>
      `,
      text: `Accept invitation to ${workspaceName}: ${acceptUrl}`,
    });
  }

  async sendTaskReminderEmail(
    email: string,
    taskTitle: string,
    dueAt: Date,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Task reminder: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Task Reminder</h2>
          <p>Your task <strong>${taskTitle}</strong> is due at ${dueAt.toLocaleString()}.</p>
          <p><a href="${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/tasks">View Tasks</a></p>
        </div>
      `,
    });
  }
}
