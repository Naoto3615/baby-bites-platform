import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authProviders: {
          select: {
            provider: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
      },
    });
  }

  async listUsers(query: UserQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            displayName: {
              contains: query.q,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items,
    };
  }

  async adminUpdateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        displayName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
