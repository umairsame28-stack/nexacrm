import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sarah@acme.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
