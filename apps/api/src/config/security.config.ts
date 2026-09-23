import { registerAs } from '@nestjs/config';

export default registerAs('security', () => {
  const encryptionKey = process.env.APP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('APP_ENCRYPTION_KEY is required but not set in environment variables');
  }

  if (encryptionKey.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY must be exactly 32 hex characters (16 bytes for AES-256-GCM). Current length: ${encryptionKey.length}`
    );
  }

  // Warn if using obviously weak key
  const weakPatterns = ['test', 'dev', 'demo', '123', 'password', 'secret', 'change'];
  if (weakPatterns.some(pattern => encryptionKey.toLowerCase().includes(pattern))) {
    console.warn('⚠️  WARNING: APP_ENCRYPTION_KEY appears to contain weak/test patterns. Use a strong random key in production.');
  }

  return {
    encryptionKey,
  };
});
