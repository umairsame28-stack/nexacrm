import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'security.encryptionKey') return 'test-encryption-key-for-unit-tests-32bytes';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt a string successfully', () => {
      const plaintext = 'JBSWY3DPEHPK3PXP'; // Example TOTP secret
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for the same plaintext (due to random IV)', () => {
      const plaintext = 'JBSWY3DPEHPK3PXP';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(1000);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🔐 émojis';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw on invalid encrypted format', () => {
      expect(() => service.decrypt('invalid-format')).toThrow(InternalServerErrorException);
    });

    it('should encrypted format contain three parts (iv:authTag:ciphertext)', () => {
      const plaintext = 'test';
      const encrypted = service.encrypt(plaintext);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // IV
      expect(parts[1]).toBeTruthy(); // Auth tag
      expect(parts[2]).toBeTruthy(); // Ciphertext
    });
  });

  describe('hashing', () => {
    it('should hash a string consistently', () => {
      const input = 'A3F9K-B2M7P';
      const hash1 = service.hash(input);
      const hash2 = service.hash(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hash('A3F9K-B2M7P');
      const hash2 = service.hash('B4G0L-C3N8Q');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const hash = service.hash('');
      expect(hash).toHaveLength(64);
    });
  });

  describe('compareHash', () => {
    it('should return true for matching input and hash', () => {
      const input = 'A3F9K-B2M7P';
      const hash = service.hash(input);

      expect(service.compareHash(input, hash)).toBe(true);
    });

    it('should return false for non-matching input and hash', () => {
      const input = 'A3F9K-B2M7P';
      const hash = service.hash('different-code');

      expect(service.compareHash(input, hash)).toBe(false);
    });

    it('should return false for hashes of different lengths', () => {
      const input = 'A3F9K-B2M7P';
      const shortHash = 'abc123';

      expect(service.compareHash(input, shortHash)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const input = 'a3f9k-b2m7p';
      const hash = service.hash('A3F9K-B2M7P');

      expect(service.compareHash(input, hash)).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should throw if ENCRYPTION_KEY is not configured', () => {
      const badConfigService = {
        get: jest.fn(() => null),
      };

      expect(() => {
        new EncryptionService(badConfigService as unknown as ConfigService);
      }).toThrow(InternalServerErrorException);
    });
  });
});
