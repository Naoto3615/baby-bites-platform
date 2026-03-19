import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class NewsQueryDto {
  @ApiPropertyOptional({ default: '離乳食 アレルギー' })
  @IsOptional()
  @IsString()
  query?: string;
}
