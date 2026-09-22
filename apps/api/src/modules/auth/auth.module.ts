import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthListener } from './auth.listener';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { EncryptionService } from './encryption.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        // Dynamic signing handled in TokenService; JwtModule just provides the service
        secret: config.get<string>('jwt.accessSecret', 'dev-secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.accessExpiry', '15m')) as unknown as number,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthListener, TokenService, PasswordService, TotpService, EncryptionService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, TokenService, PasswordService, JwtModule, PassportModule],
})
export class AuthModule {}
