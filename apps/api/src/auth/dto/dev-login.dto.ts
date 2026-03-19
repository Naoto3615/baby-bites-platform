import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class DevLoginDto {
  @ApiPropertyOptional({ example: 'dev-001' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerUserId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '保護者ユーザー' })
  @IsString()
  @MaxLength(80)
  displayName!: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
