import { AuthProvider } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class OauthLoginDto {
  @ApiProperty({ enum: [AuthProvider.GOOGLE, AuthProvider.LINE] })
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @ApiPropertyOptional({ description: 'Google id_token' })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiPropertyOptional({ description: 'Google/LINE access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ example: '匿名ユーザー' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayNameFallback?: string;
}
