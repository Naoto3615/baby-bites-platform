import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadRecipeImageDto {
  @ApiPropertyOptional({ example: '完成イメージ' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  caption?: string;
}
