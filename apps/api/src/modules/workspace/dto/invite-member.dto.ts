import { IsEmail, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceMemberRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'newagent@acme.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ enum: WorkspaceMemberRole, example: WorkspaceMemberRole.SALES_AGENT })
  @IsEnum(WorkspaceMemberRole)
  role!: WorkspaceMemberRole;
}
