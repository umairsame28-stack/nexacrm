import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TotpService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Generates a new TOTP secret for a user.
   */
  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const appName = this.config.get<string>('app.name', 'NexaCRM');
    const generated = speakeasy.generateSecret({
      name: `${appName}:${email}`,
      issuer: appName,
      length: 20,
    });

    return {
      secret: generated.base32 ?? '',
      otpauthUrl: generated.otpauth_url ?? '',
    };
  }

  /**
   * Generates a QR code data URL from an otpauth URL.
   */
  async generateQrCodeUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verifies a TOTP code against a secret.
   * Uses a ±1 step window to account for clock drift.
   */
  verify(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  /**
   * Generates a set of one-time recovery codes.
   */
  generateRecoveryCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const part1 = Math.random().toString(36).substring(2, 7).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 7).toUpperCase();
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  }
}
