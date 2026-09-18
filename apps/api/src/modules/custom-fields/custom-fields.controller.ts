import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto, ReorderCustomFieldsDto } from './dto/create-custom-field.dto';
import type { WorkspaceMemberRole } from '@prisma/client';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Custom Fields')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @ApiOperation({ summary: 'List custom field definitions' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.customFieldsService.findAll(workspaceId, entityType);
  }

  @Post()
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Create a custom field definition' })
  async create(@WorkspaceId() workspaceId: string, @Body() dto: CreateCustomFieldDto) {
    return this.customFieldsService.create(workspaceId, dto);
  }

  @Patch(':id')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Update a custom field definition' })
  async update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCustomFieldDto>,
  ) {
    return this.customFieldsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom field definition' })
  async remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.customFieldsService.remove(workspaceId, id);
  }

  @Post('reorder')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Reorder custom fields' })
  async reorder(@WorkspaceId() workspaceId: string, @Body() dto: ReorderCustomFieldsDto) {
    return this.customFieldsService.reorder(workspaceId, dto);
  }
}
