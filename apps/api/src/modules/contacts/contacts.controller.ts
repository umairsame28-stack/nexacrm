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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { ContactsMergeService } from './contacts-merge.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactsExportService } from './contacts-export.service';
import { TimelineService } from './timeline.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  MergeContactDto,
  CreateContactNoteDto,
} from './dto/create-contact.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('Contacts')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly mergeService: ContactsMergeService,
    private readonly importService: ContactsImportService,
    private readonly exportService: ContactsExportService,
    private readonly timelineService: TimelineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List contacts with filtering and pagination' })
  async findAll(@WorkspaceId() workspaceId: string, @Query() filter: ContactFilterDto) {
    return this.contactsService.findAll(workspaceId, filter);
  }

  @Post()
  @ApiOperation({ summary: 'Create a contact' })
  async create(
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateContactDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contactsService.create(workspaceId, dto, user.id);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Get suspected duplicate contacts' })
  async getDuplicates(@WorkspaceId() workspaceId: string) {
    return this.mergeService.findDuplicates(workspaceId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge two contacts' })
  async merge(@WorkspaceId() workspaceId: string, @Body() dto: MergeContactDto) {
    return this.mergeService.merge(workspaceId, dto.primaryId, dto.duplicateId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Import contacts from CSV' })
  async import(
    @WorkspaceId() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importService.startImport(workspaceId, user.id, file.buffer, file.originalname);
  }

  @Get('import/:jobId')
  @ApiOperation({ summary: 'Get import job status' })
  async getImportStatus(@Param('jobId') jobId: string) {
    return this.importService.getJobStatus(jobId);
  }

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Export contacts to CSV' })
  async export(
    @WorkspaceId() workspaceId: string,
    @Body() body: { filter?: { tags?: string[]; status?: string } },
  ) {
    return this.exportService.export(workspaceId, body.filter);
  }

  @Get('export/:jobId')
  @ApiOperation({ summary: 'Get export job status and download URL' })
  async getExportStatus(@WorkspaceId() workspaceId: string, @Param('jobId') jobId: string) {
    return this.exportService.getExportStatus(workspaceId, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact detail' })
  async findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contactsService.findById(workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<UpdateContactDto>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contactsService.update(workspaceId, id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a contact' })
  async remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.contactsService.softDelete(workspaceId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted contact' })
  async restore(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contactsService.restore(workspaceId, id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get contact activity timeline' })
  async getTimeline(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.timelineService.getTimeline(workspaceId, id, { limit, cursor });
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get contact notes' })
  async getNotes(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.prisma.contactNote.findMany({
      where: { contactId: id, workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to a contact' })
  async addNote(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateContactNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const note = await this.prisma.contactNote.create({
      data: {
        contactId: id,
        workspaceId,
        authorId: user.id,
        content: dto.content,
        isPrivate: dto.isPrivate ?? false,
      },
    });

    await this.timelineService.recordEvent(id, workspaceId, 'note_added', 'Note added', {
      actorId: user.id,
      description: dto.content.substring(0, 100),
    });

    return note;
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Update a contact note' })
  async updateNote(
    @WorkspaceId() workspaceId: string,
    @Param('id') contactId: string,
    @Param('noteId') noteId: string,
    @Body() dto: Partial<CreateContactNoteDto>,
  ) {
    const note = await this.prisma.contactNote.findFirst({
      where: { id: noteId, contactId, workspaceId },
    });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.contactNote.update({ where: { id: noteId }, data: dto });
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact note' })
  async deleteNote(
    @WorkspaceId() workspaceId: string,
    @Param('id') contactId: string,
    @Param('noteId') noteId: string,
  ) {
    const note = await this.prisma.contactNote.findFirst({
      where: { id: noteId, contactId, workspaceId },
    });
    if (!note) throw new NotFoundException('Note not found');
    await this.prisma.contactNote.delete({ where: { id: noteId } });
  }
}
