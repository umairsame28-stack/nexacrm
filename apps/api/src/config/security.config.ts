import { registerAs } from '@nestjs/config';

export default registerAs('security', () => {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is required but not set in environment variables');
  }

  if (encryptionKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption');
  }

  // Warn if using obviously weak key
  const weakPatterns = ['test', 'dev', 'demo', '123', 'password', 'secret'];
  if (weakPatterns.some(pattern => encryptionKey.toLowerCase().includes(pattern))) {
    console.warn('⚠️  WARNING: ENCRYPTION_KEY appears to contain weak/test patterns. Use a strong random key in production.');
  }

  return {
    encryptionKey,
  };
});
