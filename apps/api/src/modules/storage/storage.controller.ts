import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Redirect,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { StorageService } from './storage.service';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

class PresignDto {
  @ApiProperty({ example: 'catalog.pdf' })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 2048576 })
  @IsInt()
  @Min(1)
  @Max(52428800)
  size!: number;
}

@ApiTags('Storage')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get a pre-signed S3 upload URL' })
  async presign(@WorkspaceId() workspaceId: string, @Body() dto: PresignDto) {
    return this.storageService.getPresignedUploadUrl(
      workspaceId,
      dto.fileName,
      dto.mimeType,
      dto.size,
    );
  }

  @Get('url/*fileKey')
  @Redirect()
  @ApiOperation({ summary: 'Redirect to a pre-signed S3 GET URL' })
  async getUrl(
    @WorkspaceId() workspaceId: string,
    @Param('fileKey') fileKey: string,
  ) {
    const url = await this.storageService.getSignedUrl(workspaceId, fileKey);
    return { url, statusCode: 302 };
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete a file from storage' })
  async deleteFile(
    @WorkspaceId() workspaceId: string,
    @Body() body: { fileKey: string },
  ) {
    await this.storageService.deleteFile(workspaceId, body.fileKey);
    return { success: true };
  }
}
