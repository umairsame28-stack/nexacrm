import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'LATAM Team' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Handles Latin America region' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class AddTeamMemberDto {
  @ApiProperty()
  @IsUUID()
  memberId!: string;
}
