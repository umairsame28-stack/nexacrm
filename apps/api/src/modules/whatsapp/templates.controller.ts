import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './services/templates.service';
import { CreateTemplateDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('WhatsApp — Templates')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('message-templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List message templates' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.findAll(user.workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a message template' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(user.workspaceId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.templatesService.findById(user.workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.update(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.templatesService.remove(user.workspaceId, id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Sync approved templates from Meta API' })
  sync(@CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.syncFromMeta(user.workspaceId);
  }
}
