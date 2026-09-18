import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsIn,
  Matches,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @ApiProperty({ example: 'contact', enum: ['contact', 'lead', 'deal'] })
  @IsString()
  @IsIn(['contact', 'lead', 'deal'])
  entityType!: string;

  @ApiProperty({ example: 'Monthly Recurring Revenue' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'mrr', description: 'snake_case machine key' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'Key must be lowercase snake_case' })
  key!: string;

  @ApiProperty({ enum: CustomFieldType })
  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  @ApiPropertyOptional({ description: 'Options for SELECT/MULTI_SELECT types' })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderCustomFieldsDto {
  @ApiProperty({ description: 'Ordered array of custom field IDs' })
  @IsArray()
  @IsString({ each: true })
  fieldIds!: string[];
}
