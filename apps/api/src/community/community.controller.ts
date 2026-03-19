import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityQueryDto } from './dto/community-query.dto';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('topics')
  @ApiOperation({ summary: 'コミュニティトピック一覧を取得' })
  getTopics() {
    return this.communityService.getTopics();
  }

  @Get('posts')
  @ApiOperation({ summary: 'コミュニティ投稿一覧を取得' })
  getPosts(@Query() query: CommunityQueryDto) {
    return this.communityService.getPosts(query);
  }

  @Post('posts')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'コミュニティ投稿を作成（ログイン必須）' })
  createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communityService.createPost(dto, user.id);
  }

  @Post('posts/:postId/comments')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'コミュニティ投稿にコメントを追加（ログイン必須）' })
  createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communityService.createComment(postId, dto, user.id);
  }
}
