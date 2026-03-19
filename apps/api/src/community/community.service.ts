import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityQueryDto } from './dto/community-query.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopics() {
    return this.prisma.communityTopic.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async getPosts(query: CommunityQueryDto) {
    const where = {
      ...(query.topicId ? { topicId: query.topicId } : {}),
      isHidden: false,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.communityPost.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          topic: true,
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          comments: {
            where: { isHidden: false },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items,
    };
  }

  async createPost(dto: CreatePostDto, authorId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author || !author.isActive) {
      throw new NotFoundException('Author user not found or inactive');
    }

    const topicExists = await this.prisma.communityTopic.findUnique({
      where: { id: dto.topicId },
    });
    if (!topicExists) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.communityPost.create({
      data: {
        topicId: dto.topicId,
        title: dto.title,
        body: dto.body,
        stage: dto.stage,
        authorId,
      },
      include: {
        topic: true,
        author: true,
      },
    });
  }

  async createComment(postId: string, dto: CreateCommentDto, authorId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author || !author.isActive) {
      throw new NotFoundException('Author user not found or inactive');
    }

    const postExists = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!postExists || postExists.isHidden) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.communityComment.create({
      data: {
        postId,
        body: dto.body,
        authorId,
      },
      include: {
        author: true,
      },
    });
  }
}
