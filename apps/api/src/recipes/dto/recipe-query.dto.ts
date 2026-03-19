import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { FeedingStage } from '../../common/enums/feeding-stage.enum';

export class RecipeQueryDto {
  @ApiPropertyOptional({ enum: FeedingStage })
  @IsOptional()
  @IsEnum(FeedingStage)
  stage?: FeedingStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergen?: string;

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
