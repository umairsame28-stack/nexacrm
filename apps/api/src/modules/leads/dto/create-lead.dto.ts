import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty()
  @IsUUID()
  contactId!: string;

  @ApiProperty()
  @IsUUID()
  pipelineId!: string;

  @ApiProperty()
  @IsUUID()
  stageId!: string;

  @ApiProperty({ example: 'Enterprise Demo Request' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  followUpNote?: string;
}

export class UpdateLeadDto extends CreateLeadDto {}

export class MoveLeadStageDto {
  @ApiProperty()
  @IsUUID()
  stageId!: string;
}

export class ConvertLeadDto {
  @ApiProperty()
  @IsUUID()
  dealPipelineId!: string;

  @ApiProperty()
  @IsUUID()
  dealStageId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dealValue?: number;
}

export class CreatePipelineDto {
  @ApiProperty({ example: 'Inbound Sales' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreatePipelineStageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '#f59e0b' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;
}

export class ReorderStagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  stageIds!: string[];
}

export class LeadFilterDto {
  @IsOptional() pipelineId?: string;
  @IsOptional() stageId?: string;
  @IsOptional() assignedTo?: string;
  @IsOptional() status?: LeadStatus;
  @IsOptional() minScore?: number;
  @IsOptional() maxScore?: number;
  @IsOptional() search?: string;
  @IsOptional() limit?: number;
  @IsOptional() cursor?: string;
}
