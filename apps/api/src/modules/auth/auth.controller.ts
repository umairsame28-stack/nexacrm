import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TotpVerifyDto, TotpConfirmDto, TotpDisableDto } from './dto/totp-verify.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a new user and workspace' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      dto,
      req.ip,
      req.headers['user-agent'],
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      workspace: result.workspace,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);

    if (result.requiresTOTP) {
      return { requiresTOTP: true, tempToken: result.tempToken, user: result.user };
    }

    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
      workspace: result.workspace,
      requiresTOTP: false,
    };
  }

  @Public()
  @Post('login/totp')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login with TOTP code' })
  async loginWithTotp(
    @Body() dto: TotpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithTotp(
      dto.tempToken,
      dto.code,
      req.ip,
      req.headers['user-agent'],
    );

    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
      workspace: result.workspace,
    };
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = this.config.get<string>('jwt.refreshCookieName', 'nexacrm_refresh');
    const refreshToken = (req.cookies as Record<string, string>)[cookieName];

    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Refresh token not found' });
    }

    const result = await this.authService.refresh(refreshToken, req.ip, req.headers['user-agent']);
    this.setRefreshTokenCookie(res, result.newRefreshToken);

    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = this.config.get<string>('jwt.refreshCookieName', 'nexacrm_refresh');
    const refreshToken = (req.cookies as Record<string, string>)[cookieName];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(cookieName, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
  }

  @Public()
  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If this email exists, a reset link was sent.' };
  }

  @Public()
  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Enable 2FA — returns secret and QR code' })
  async enable2fa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.enableTotp(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirm')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Confirm 2FA with a TOTP code' })
  async confirm2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TotpConfirmDto,
  ) {
    return this.authService.confirmTotp(user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TotpDisableDto,
  ) {
    await this.authService.disableTotp(user.id, dto.code);
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    const cookieName = this.config.get<string>('jwt.refreshCookieName', 'nexacrm_refresh');
    const isProduction = this.config.get<string>('app.nodeEnv') === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
