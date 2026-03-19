import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Max, Min } from 'class-validator';

export class CommunityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  offset = 0;
}
