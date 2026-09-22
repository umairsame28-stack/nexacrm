import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { AdminUsersService } from '../services/admin-users.service';
import {
  UserQueryDto,
  UpdateUserStatusDto,
  ResetUserPasswordDto,
} from '../dto/admin-user.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT')
@UseGuards(SuperAdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@Query() query: UserQueryDto) {
    return this.adminUsersService.getAllUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID with detailed information' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (activate, suspend, etc.)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminUsersService.updateUserStatus(id, dto, admin.id);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password (admin-initiated)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminUsersService.resetUserPassword(id, dto.newPassword, admin.id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved' })
  async getUserActivity(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.getUserActivity(id, page, limit);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete this user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminUsersService.deleteUser(id, admin.id);
  }

  @Post(':id/promote-super-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote user to super admin' })
  @ApiResponse({ status: 200, description: 'User promoted successfully' })
  @ApiResponse({ status: 400, description: 'User is already a super admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async promoteToSuperAdmin(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminUsersService.promoteToSuperAdmin(id, admin.id);
  }

  @Post(':id/demote-super-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demote super admin to regular user' })
  @ApiResponse({ status: 200, description: 'User demoted successfully' })
  @ApiResponse({ status: 400, description: 'User is not a super admin or cannot demote self' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async demoteFromSuperAdmin(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminUsersService.demoteFromSuperAdmin(id, admin.id);
  }
}
