import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AuthUrlQueryDto {
  @ApiPropertyOptional({ description: 'OAuth state (未指定時はサーバー生成)' })
  @IsOptional()
  @IsString()
  state?: string;
}
