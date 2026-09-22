import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkspaceStatusDto {
  @ApiProperty({
    description: 'Whether workspace is active',
    example: false,
  })
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Payment overdue',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class WorkspaceQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or slug', example: 'acme' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
  sortOrder?: 'asc' | 'desc';
}
