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
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty()
  @IsUUID()
  pipelineId!: string;

  @ApiProperty()
  @IsUUID()
  stageId!: string;

  @ApiProperty({ example: 'Acme Corp — Enterprise Plan' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 24000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  contactIds?: string[];
}

export class UpdateDealDto extends CreateDealDto {}

export class MarkDealWonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closedAt?: string;
}

export class MarkDealLostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}

export class CreateDealNoteDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  content!: string;
}

export class CreateDealPipelineDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateDealStageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLost?: boolean;
}

export class DealFilterDto {
  @IsOptional() pipelineId?: string;
  @IsOptional() stageId?: string;
  @IsOptional() status?: DealStatus;
  @IsOptional() assignedTo?: string;
  @IsOptional() minValue?: number;
  @IsOptional() maxValue?: number;
  @IsOptional() search?: string;
  @IsOptional() limit?: number;
  @IsOptional() cursor?: string;
}
