import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FeedingStage } from '../../common/enums/feeding-stage.enum';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  topicId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ enum: FeedingStage })
  @IsOptional()
  @IsEnum(FeedingStage)
  stage?: FeedingStage;
}
