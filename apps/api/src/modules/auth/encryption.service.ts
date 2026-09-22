import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const encryptionKey = this.config.get<string>('security.encryptionKey');
    
    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY is not configured. Please set ENCRYPTION_KEY in environment variables.',
      );
    }

    // Derive a 32-byte key using scrypt for AES-256
    // Using a fixed salt here for deterministic key derivation from the same secret
    // In production, consider using the encryptionKey directly if it's already 32 bytes
    const salt = 'nexacrm-totp-salt'; // Fixed salt for key derivation
    this.key = scryptSync(encryptionKey, salt, 32);
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   * Returns a string in format: iv:authTag:ciphertext (all base64 encoded)
   */
  encrypt(plaintext: string): string {
    try {
      const iv = randomBytes(16); // 128-bit IV for GCM
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  /**
   * Decrypts an encrypted string in format: iv:authTag:ciphertext
   * Returns the original plaintext string.
   */
  decrypt(encrypted: string): string {
    try {
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const ciphertext = parts[2];

      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('Decryption failed');
    }
  }

  /**
   * Hashes a string using SHA-256 (for recovery codes).
   * Returns a hex-encoded hash.
   */
  hash(input: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Compares a plaintext input with a hash (constant-time comparison).
   */
  compareHash(input: string, hash: string): boolean {
    const inputHash = this.hash(input);
    
    // Constant-time comparison to prevent timing attacks
    if (inputHash.length !== hash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < inputHash.length; i++) {
      result |= inputHash.charCodeAt(i) ^ hash.charCodeAt(i);
    }

    return result === 0;
  }
}
