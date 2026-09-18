/**
 * Production Secret Validation
 * 
 * Validates that security-sensitive secrets are properly configured in production.
 * Prevents application startup if required secrets are missing or use unsafe defaults.
 */

interface SecretValidationError {
  field: string;
  issue: string;
}

const DANGEROUS_DEFAULTS = [
  'nexacrm-dev-secret-change-in-production-min-32-chars',
  'your-secret-here',
  'change-me',
  'secret',
  'password',
  'temp',
  'test',
  'default',
  '6e65786163726d64657673656372657431323334', // hex-encoded 'nexacrmdevsecret1234'
];

export function validateProductionSecrets(env: Record<string, string | undefined>): void {
  const isProduction = env.NODE_ENV === 'production';
  const errors: SecretValidationError[] = [];

  // JWT Access Secret (critical)
  if (!env.JWT_ACCESS_SECRET) {
    errors.push({
      field: 'JWT_ACCESS_SECRET',
      issue: 'Missing required secret. Set a strong random value.',
    });
  } else if (DANGEROUS_DEFAULTS.some((d) => env.JWT_ACCESS_SECRET?.includes(d))) {
    errors.push({
      field: 'JWT_ACCESS_SECRET',
      issue: 'Using unsafe default value. Generate a secure secret.',
    });
  } else if (isProduction && env.JWT_ACCESS_SECRET.length < 32) {
    errors.push({
      field: 'JWT_ACCESS_SECRET',
      issue: 'Secret too short for production (minimum 32 characters).',
    });
  }

  // Encryption Key (critical for WhatsApp tokens, AI keys)
  if (!env.APP_ENCRYPTION_KEY) {
    errors.push({
      field: 'APP_ENCRYPTION_KEY',
      issue: 'Missing required encryption key.',
    });
  } else if (DANGEROUS_DEFAULTS.some((d) => env.APP_ENCRYPTION_KEY?.includes(d))) {
    errors.push({
      field: 'APP_ENCRYPTION_KEY',
      issue: 'Using unsafe default encryption key. Generate a new 32-byte hex key.',
    });
  } else if (env.APP_ENCRYPTION_KEY.length !== 32) {
    errors.push({
      field: 'APP_ENCRYPTION_KEY',
      issue: 'Encryption key must be exactly 32 hex characters (16 bytes for AES-256-GCM).',
    });
  }

  // Database URL (critical)
  if (!env.DATABASE_URL) {
    errors.push({
      field: 'DATABASE_URL',
      issue: 'Missing database connection string.',
    });
  }

  // Redis (critical for queues)
  if (!env.REDIS_URL && !env.REDIS_HOST) {
    errors.push({
      field: 'REDIS_URL or REDIS_HOST',
      issue: 'Missing Redis configuration.',
    });
  }

  // In production, enforce strict validation
  if (isProduction && errors.length > 0) {
    console.error('\n❌ PRODUCTION SECRET VALIDATION FAILED\n');
    console.error('The following security issues must be resolved before starting:\n');
    
    errors.forEach((err) => {
      console.error(`  • ${err.field}: ${err.issue}`);
    });
    
    console.error('\nRefer to .env.example for guidance on setting secure values.');
    console.error('Application startup aborted for security.\n');
    
    process.exit(1);
  }

  // In development, warn but allow startup
  if (!isProduction && errors.length > 0) {
    console.warn('\n⚠️  Development Environment: Secret Warnings\n');
    errors.forEach((err) => {
      console.warn(`  • ${err.field}: ${err.issue}`);
    });
    console.warn('\nThese warnings are non-blocking in development but MUST be fixed for production.\n');
  }
}
