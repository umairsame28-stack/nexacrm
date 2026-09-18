import { IsString, IsOptional, IsUUID, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestReplyDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;
}

export class SummarizeConversationDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;
}

export class RewriteDto {
  @ApiProperty({ example: 'hey did u get my message?' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;

  @ApiPropertyOptional({ enum: ['professional', 'friendly', 'formal'], default: 'professional' })
  @IsOptional()
  @IsEnum(['professional', 'friendly', 'formal'])
  tone?: 'professional' | 'friendly' | 'formal';
}

export class CorrectGrammarDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;
}

export class TranslateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  targetLanguage!: string;
}

export class QualifyLeadDto {
  @ApiProperty()
  @IsUUID()
  leadId!: string;
}

export class SentimentAnalysisDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;
}

export class SuggestTagsDto {
  @ApiProperty()
  @IsUUID()
  contactId!: string;
}

export class GenerateFollowUpDto {
  @ApiProperty()
  @IsUUID()
  dealId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;
}

export class AISearchDto {
  @ApiProperty({ example: 'customers who complained about shipping delays' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  query!: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

export class InsightsDto {
  @ApiPropertyOptional({ example: 'last_30_days' })
  @IsOptional()
  @IsString()
  period?: string;
}
