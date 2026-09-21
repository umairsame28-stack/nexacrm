import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';
import { WorkspaceService } from './workspace.service';
import { MembersService } from './members.service';
import { InvitationsService } from './invitations.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { StorageService } from '../storage/storage.service';
import type { WorkspaceMemberRole } from '@prisma/client';

@ApiTags('Workspace')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly membersService: MembersService,
    private readonly invitationsService: InvitationsService,
    private readonly storageService: StorageService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  async getWorkspace(@Param('id') id: string) {
    return this.workspaceService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Update workspace profile' })
  async updateWorkspace(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaceService.update(id, dto);
  }

  @Post(':id/logo')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload workspace logo' })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileKey = await this.storageService.uploadFile(
      id,
      `workspaces/${id}/logo/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    const logoUrl = await this.storageService.getSignedUrl(id, fileKey);
    return this.workspaceService.updateLogo(id, logoUrl);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  async listMembers(
    @Param('id') id: string,
    @Query('role') role?: WorkspaceMemberRole,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.membersService.list(id, { role, search, limit, cursor });
  }

  @Patch(':id/members/:memberId')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Update member role or status' })
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.update(id, memberId, dto, user.id);
  }

  @Delete(':id/members/:memberId')
  @Roles('ADMINISTRATOR' as WorkspaceMemberRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.membersService.remove(id, memberId, user.id);
  }

  @Post(':id/invitations')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'Invite a user to the workspace' })
  async invite(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.invitationsService.create(id, dto);
  }

  @Get(':id/invitations')
  @Roles('MANAGER' as WorkspaceMemberRole)
  @ApiOperation({ summary: 'List pending invitations' })
  async listInvitations(@Param('id') id: string) {
    return this.invitationsService.list(id);
  }
}
