import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FeedingStage } from '../../common/enums/feeding-stage.enum';

class IngredientInput {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

class StepInput {
  @ApiProperty()
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty()
  @IsString()
  instruction!: string;
}

export class CreateRecipeDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: FeedingStage })
  @IsEnum(FeedingStage)
  stage!: FeedingStage;

  @ApiProperty({ default: 10 })
  @IsInt()
  @Min(0)
  @Max(300)
  prepMinutes!: number;

  @ApiProperty({ default: 15 })
  @IsInt()
  @Min(0)
  @Max(300)
  cookMinutes!: number;

  @ApiProperty({ default: 4 })
  @IsInt()
  @Min(1)
  @Max(20)
  servings!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'カバー画像URL（アップロード前提なら省略可）',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({ type: [IngredientInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => IngredientInput)
  ingredients!: IngredientInput[];

  @ApiProperty({ type: [StepInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => StepInput)
  steps!: StepInput[];
}
