import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoveryCodeLoginDto {
  @ApiProperty({ description: 'Temporary token from initial login', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @ApiProperty({ description: 'Recovery code (format: XXXXX-XXXXX)', example: 'A3F9K-B2M7P' })
  @IsString()
  @IsNotEmpty()
  recoveryCode!: string;
}
