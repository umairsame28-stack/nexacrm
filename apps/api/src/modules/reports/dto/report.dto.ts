import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFilterDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pipelineId?: string;
}

export class ExportReportDto {
  @ApiPropertyOptional({ enum: ['sales', 'revenue', 'agent-performance', 'pipeline', 'whatsapp'] })
  @IsString()
  report!: string;

  @ApiPropertyOptional({ enum: ['pdf', 'csv'], default: 'csv' })
  @IsOptional()
  @IsEnum(['pdf', 'csv'])
  format?: 'pdf' | 'csv';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
