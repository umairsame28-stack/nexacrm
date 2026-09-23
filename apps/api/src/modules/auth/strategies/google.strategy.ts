import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly config: ConfigService) {
    const clientId = config.get<string>('oauth.google.clientId');
    const clientSecret = config.get<string>('oauth.google.clientSecret');
    const callbackUrl = config.get<string>('oauth.google.callbackUrl');

    // Skip initialization if Google OAuth is not configured
    if (!clientId || !clientSecret) {
      // Use dummy credentials to prevent passport-google-oauth20 from throwing
      // The strategy won't be used since the routes won't be accessible
      const options: StrategyOptions = {
        clientID: 'dummy-client-id',
        clientSecret: 'dummy-client-secret',
        callbackURL: callbackUrl || 'http://localhost:3001/api/v1/auth/google/callback',
        scope: ['email', 'profile'],
      };
      super(options);
      this.logger.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
      return;
    }

    const options: StrategyOptions = {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    };
    super(options);
    this.logger.log('Google OAuth configured successfully');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatarUrl: photos?.[0]?.value,
      accessToken,
    };

    done(null, user);
  }
}
