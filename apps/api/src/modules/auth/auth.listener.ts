import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EmailNotificationService } from '../notifications/email-notification.service';

interface PasswordResetEvent {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  workspaceId?: string;
}

interface UserRegisteredEvent {
  userId: string;
  workspaceId: string;
}

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);

  constructor(
    private readonly emailService: EmailNotificationService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('auth.password_reset_requested')
  async handlePasswordResetRequested(event: PasswordResetEvent): Promise<void> {
    try {
      const appUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      
      this.logger.log(`Sending password reset email to ${event.email} for workspace ${event.workspaceId || 'global'}`);
      
      await this.emailService.sendPasswordResetEmail(
        event.email,
        event.token,
        appUrl,
        event.workspaceId,
      );

      this.logger.log(`Password reset email sent successfully to ${event.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${event.email}:`, error);
      // Don't throw — we don't want to fail the API request if email fails
    }
  }

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      this.logger.log(`User registered: ${event.userId} in workspace ${event.workspaceId}`);
      // TODO: Send welcome email or email verification
      // For now, just log it
    } catch (error) {
      this.logger.error(`Failed to handle user registration event:`, error);
    }
  }
}
