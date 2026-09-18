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
    const key = config.get<string>('app.encryptionKey') ?? process.env.APP_ENCRYPTION_KEY ?? '';
    if (!key) {
      throw new Error(
        'APP_ENCRYPTION_KEY is not set. ' +
        'Run: openssl rand -hex 16 and set the result as APP_ENCRYPTION_KEY.',
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
