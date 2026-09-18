import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  name: process.env.APP_NAME ?? 'NexaCRM',
  port: parseInt(process.env.PORT ?? '3001', 10),
  url: process.env.APP_URL ?? 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000',
  encryptionKey: process.env.APP_ENCRYPTION_KEY ?? '',
}));
