import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { UpdatePostDto } from './dto/update-post.dto';

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

  @Get('posts/mine')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'ログインユーザーのコミュニティ投稿一覧を取得' })
  getMyPosts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommunityQueryDto,
  ) {
    return this.communityService.getMyPosts(user.id, query);
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

  @Patch('posts/:postId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '自分のコミュニティ投稿を更新（ログイン必須）' })
  updateMyPost(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.communityService.updateMyPost(postId, user.id, dto);
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
