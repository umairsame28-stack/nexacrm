import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsEmail,
  IsUrl,
  Min,
  Max,
  MaxLength,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AIProvider } from '@prisma/client';

export class UpdateWorkspaceProfileDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsString()
  primaryColor?: string;
}

export class UpdateWhatsappSettingsDto {
  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  wabPhoneNumberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wabAccessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wabWebhookSecret?: string;

  @ApiPropertyOptional({ example: 'my-verify-token-123' })
  @IsOptional()
  @IsString()
  wabVerifyToken?: string;
}

export class TestWhatsappDto {
  @IsString()
  @MaxLength(100)
  wabPhoneNumberId!: string;

  @IsString()
  wabAccessToken!: string;
}

export class UpdateAISettingsDto {
  @ApiPropertyOptional({ enum: AIProvider })
  @IsOptional()
  @IsEnum(AIProvider)
  aiProvider?: AIProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiApiKey?: string;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  aiModel?: string;
}

export class UpdateSmtpSettingsDto {
  @ApiPropertyOptional({ example: 'smtp.resend.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional({ example: 'noreply@acme.com' })
  @IsOptional()
  @IsEmail()
  smtpFromEmail?: string;

  @ApiPropertyOptional({ example: 'Acme CRM' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  smtpFromName?: string;
}

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enforce2FA?: boolean;

  @ApiPropertyOptional({ example: 1440 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(43200)
  sessionTimeoutMins?: number;

  @ApiPropertyOptional({ type: [String], example: ['203.0.113.0/24'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];
}

export class CreateApiKeyDto {
  @ApiPropertyOptional({ example: 'Zapier Integration' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class AuditLogFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  cursor?: string;
}
