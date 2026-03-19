import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class NearbyQueryDto {
  @ApiPropertyOptional({ default: 35.681236 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiPropertyOptional({ default: 139.767125 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({ default: '小児科' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
