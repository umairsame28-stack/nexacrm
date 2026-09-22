import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    description: 'New user status',
    example: 'SUSPENDED',
  })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Violation of terms of service',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetUserPasswordDto {
  @ApiProperty({
    description: 'New temporary password',
    example: 'TempPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiPropertyOptional({
    description: 'Whether to require password change on next login',
    example: true,
    default: true,
  })
  @IsOptional()
  requirePasswordChange?: boolean;
}

export class PromoteToSuperAdminDto {
  @ApiProperty({
    description: 'Email of user to promote',
    example: 'admin@nexacrm.com',
  })
  @IsEmail()
  email!: string;
}

export class ImpersonateUserDto {
  @ApiProperty({
    description: 'User ID to impersonate',
    example: 'clx1234567890',
  })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Reason for impersonation (logged in audit)',
    example: 'Customer support - troubleshooting issue',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Search by email or name', example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Filter by status',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
