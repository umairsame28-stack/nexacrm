import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encrypt, decrypt, encryptNullable, decryptNullable } from './crypto.util';

/**
 * Injectable wrapper around the AES-256-GCM crypto utilities.
 * Reads APP_ENCRYPTION_KEY from ConfigService once at construction time
 * so callers never need to pass the secret themselves.
 */
@Injectable()
export class CryptoService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('app.encryptionKey');
    if (!key) {
      throw new Error(
        'APP_ENCRYPTION_KEY is not configured. This should be caught by security.config.ts validation. ' +
        'Ensure APP_ENCRYPTION_KEY is set and app.module.ts loads securityConfig.',
      );
    }
    if (key.length < 32) {
      throw new Error(
        `APP_ENCRYPTION_KEY must be at least 32 characters for AES-256. Current length: ${key.length}`,
      );
    }
    this.secret = key;
  }

  encrypt(plaintext: string): string {
    return encrypt(plaintext, this.secret);
  }

  decrypt(ciphertext: string): string {
    return decrypt(ciphertext, this.secret);
  }

  encryptNullable(value: string | null | undefined): string | null {
    return encryptNullable(value, this.secret);
  }

  decryptNullable(value: string | null | undefined): string | null {
    return decryptNullable(value, this.secret);
  }
}
