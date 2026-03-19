import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('nearby')
  @ApiOperation({ summary: '近隣の子育て関連スポットを取得（Google Places）' })
  getNearby(@Query() query: NearbyQueryDto) {
    return this.resourcesService.getNearby(query);
  }

  @Get('news')
  @ApiOperation({ summary: '子育て関連ニュース・記事を取得（Google/Yahoo）' })
  getNews(@Query() query: NewsQueryDto) {
    return this.resourcesService.getNews(query);
  }
}
