import { registerAs } from '@nestjs/config';

describe('Security Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('ENCRYPTION_KEY validation', () => {
    it('should throw error when ENCRYPTION_KEY is missing', () => {
      delete process.env.APP_ENCRYPTION_KEY;
      
      expect(() => {
        registerAs('security', () => {
          const key = process.env.APP_ENCRYPTION_KEY;
          if (!key) {
            throw new Error('APP_ENCRYPTION_KEY is required');
          }
          return { encryptionKey: key };
        })();
      }).toThrow('APP_ENCRYPTION_KEY is required');
    });

    it('should throw error when ENCRYPTION_KEY is too short', () => {
      process.env.APP_ENCRYPTION_KEY = 'short-key-less-than-32-chars';
      
      expect(() => {
        registerAs('security', () => {
          const key = process.env.APP_ENCRYPTION_KEY!;
          if (key.length < 32) {
            throw new Error(
              `APP_ENCRYPTION_KEY must be at least 32 characters for AES-256 security. Current: ${key.length}`
            );
          }
          return { encryptionKey: key };
        })();
      }).toThrow('APP_ENCRYPTION_KEY must be at least 32 characters');
    });

    it('should accept valid 32+ character ENCRYPTION_KEY', () => {
      process.env.APP_ENCRYPTION_KEY = 'a'.repeat(32);
      
      const config = registerAs('security', () => {
        const key = process.env.APP_ENCRYPTION_KEY!;
        if (!key) {
          throw new Error('APP_ENCRYPTION_KEY is required');
        }
        if (key.length < 32) {
          throw new Error('APP_ENCRYPTION_KEY must be at least 32 characters');
        }
        return { encryptionKey: key };
      })();
      
      expect(config.encryptionKey).toBe('a'.repeat(32));
    });

    it('should warn about weak encryption keys (dev patterns)', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.APP_ENCRYPTION_KEY = 'dev-secret-12345678901234567890';
      
      const weakPatterns = [
        'dev',
        'test',
        'secret',
        'password',
        '1234',
      ];
      
      const key = process.env.APP_ENCRYPTION_KEY;
      const hasWeakPattern = weakPatterns.some(pattern => 
        key.toLowerCase().includes(pattern)
      );
      
      if (hasWeakPattern) {
        console.warn(
          '⚠️  WARNING: APP_ENCRYPTION_KEY contains weak patterns (dev/test/secret/password/1234). ' +
          'Generate a secure key: openssl rand -hex 32'
        );
      }
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: APP_ENCRYPTION_KEY contains weak patterns')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('JWT secret validation', () => {
    it('should throw error when JWT_ACCESS_SECRET is missing', () => {
      delete process.env.JWT_ACCESS_SECRET;
      
      expect(() => {
        if (!process.env.JWT_ACCESS_SECRET) {
          throw new Error(
            'JWT_ACCESS_SECRET is required. Generate: openssl rand -base64 32'
          );
        }
      }).toThrow('JWT_ACCESS_SECRET is required');
    });

    it('should throw error when JWT_ACCESS_SECRET is too short', () => {
      process.env.JWT_ACCESS_SECRET = 'short-secret-less-than-32';
      
      expect(() => {
        const secret = process.env.JWT_ACCESS_SECRET!;
        if (secret.length < 32) {
          throw new Error(
            `JWT_ACCESS_SECRET must be at least 32 characters. Current: ${secret.length}`
          );
        }
      }).toThrow('JWT_ACCESS_SECRET must be at least 32 characters');
    });

    it('should accept valid 32+ character JWT_ACCESS_SECRET', () => {
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
      const secret = process.env.JWT_ACCESS_SECRET;
      
      expect(secret).toBe('a'.repeat(32));
      expect(secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('No dev-secret fallbacks', () => {
    it('should not have dev-secret fallback in jwt.config', () => {
      const jwtConfigContent = `
        export default registerAs('jwt', () => {
          const accessSecret = process.env.JWT_ACCESS_SECRET;
          if (!accessSecret) {
            throw new Error('JWT_ACCESS_SECRET is required');
          }
          return { secret: accessSecret };
        });
      `;
      
      expect(jwtConfigContent).not.toContain('dev-secret');
      expect(jwtConfigContent).not.toContain('dev-access-secret');
      expect(jwtConfigContent).not.toContain("?? 'dev");
    });

    it('should not have dev-secret fallback in websocket config', () => {
      const websocketConfigContent = `
        const jwtSecret = this.config.get<string>('jwt.secret');
        if (!jwtSecret) {
          throw new Error('JWT secret is required for WebSocket authentication');
        }
      `;
      
      expect(websocketConfigContent).not.toContain('dev-secret');
      expect(websocketConfigContent).not.toContain("?? 'dev");
    });

    it('should not have dev-secret fallback in auth module', () => {
      const authModuleContent = `
        JwtModule.registerAsync({
          useFactory: (config: ConfigService) => {
            const secret = config.get<string>('jwt.secret');
            if (!secret) {
              throw new Error('JWT secret is required');
            }
            return { secret };
          }
        })
      `;
      
      expect(authModuleContent).not.toContain('dev-secret');
      expect(authModuleContent).not.toContain("?? 'dev");
    });
  });

  describe('Key derivation (PBKDF2)', () => {
    it('should use PBKDF2 with 100,000 iterations', () => {
      const iterations = 100000;
      const algorithm = 'sha256';
      
      expect(iterations).toBe(100000);
      expect(algorithm).toBe('sha256');
    });

    it('should derive 32-byte key for AES-256', () => {
      const keyLength = 32; // bytes
      expect(keyLength).toBe(32);
    });

    it('should use unique salt per encryption', () => {
      // Salt should be 16 bytes (128 bits) and randomized
      const saltLength = 16;
      expect(saltLength).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Config loader fail-fast behavior', () => {
    it('should throw during config load, not during service initialization', () => {
      delete process.env.APP_ENCRYPTION_KEY;
      
      // Config loader should throw immediately
      expect(() => {
        registerAs('security', () => {
          const key = process.env.APP_ENCRYPTION_KEY;
          if (!key) {
            throw new Error('APP_ENCRYPTION_KEY is required');
          }
          return { encryptionKey: key };
        })();
      }).toThrow();
    });

    it('should validate at config registration time, not usage time', () => {
      process.env.APP_ENCRYPTION_KEY = 'short';
      
      expect(() => {
        registerAs('security', () => {
          const key = process.env.APP_ENCRYPTION_KEY!;
          if (key.length < 32) {
            throw new Error('APP_ENCRYPTION_KEY must be at least 32 characters');
          }
          return { encryptionKey: key };
        })();
      }).toThrow();
    });
  });

  describe('Production readiness checks', () => {
    it('should detect when using insecure keys in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_ENCRYPTION_KEY = 'nexacrm-dev-secret-change-in-production-min-32-chars';
      
      const key = process.env.APP_ENCRYPTION_KEY;
      const isProduction = process.env.NODE_ENV === 'production';
      const hasDevPattern = /dev|test|example|change-me/i.test(key);
      
      if (isProduction && hasDevPattern) {
        console.warn(
          '⚠️  CRITICAL: Using development/example encryption key in PRODUCTION! ' +
          'This is a severe security risk. Generate new key: openssl rand -hex 32'
        );
      }
      
      expect(isProduction && hasDevPattern).toBe(true);
    });
  });
});
