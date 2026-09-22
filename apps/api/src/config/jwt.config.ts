import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  
  if (!accessSecret) {
    throw new Error('JWT_ACCESS_SECRET is required but not set in environment variables');
  }
  
  if (accessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
  }

  return {
    accessSecret,
    privateKey: process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
    publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    refreshExpiryDays: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS ?? '7', 10),
    refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME ?? 'nexacrm_refresh',
  };
});
