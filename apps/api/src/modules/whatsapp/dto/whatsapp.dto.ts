import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsObject,
  IsArray,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, MessageType } from '@prisma/client';

// ─── Conversation DTOs ────────────────────────────────────────────────────────

export class ConversationFilterDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  limit?: number;

  @IsOptional()
  cursor?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class AddLabelDto {
  @ApiProperty()
  @IsUUID()
  labelId!: string;
}

// ─── Message DTOs ─────────────────────────────────────────────────────────────

export class SendMessageDto {
  @ApiProperty({ enum: ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'TEMPLATE'] })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  body?: string;

  @ApiPropertyOptional({ description: 'S3 file key for media messages' })
  @IsOptional()
  @IsString()
  mediaKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  mediaCaption?: string;

  @ApiPropertyOptional({ description: 'Template name for TEMPLATE type' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({ description: 'Template variable substitutions' })
  @IsOptional()
  @IsObject()
  templateVars?: Record<string, string>;

  @ApiPropertyOptional({ description: 'ID of message being quoted/replied to' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class ScheduleMessageDto extends SendMessageDto {
  @ApiProperty({ example: '2026-08-05T09:00:00Z' })
  @IsDateString()
  scheduledAt!: string;
}

export class InternalNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

// ─── Template DTOs ────────────────────────────────────────────────────────────

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 'MARKETING' })
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  headerText?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  bodyText!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  footerText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  buttons?: unknown;
}

// ─── Broadcast DTOs ───────────────────────────────────────────────────────────

export class CreateBroadcastDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateVars?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Contact filter criteria' })
  @IsOptional()
  @IsObject()
  filterCriteria?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

// ─── Quick Reply DTOs ─────────────────────────────────────────────────────────

export class CreateQuickReplyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ example: '/pricing' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shortcut?: string;
}

export class UpdateQuickReplyDto extends CreateQuickReplyDto {}
