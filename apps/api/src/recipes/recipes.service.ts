import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { UploadedImageFile } from './uploaded-image-file.type';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RecipeQueryDto) {
    const where: Prisma.RecipeWhereInput = {
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.allergen ? { allergens: { has: query.allergen } } : {}),
      published: true,
      isHidden: false,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: true,
          images: { orderBy: { uploadedAt: 'asc' } },
          ingredients: { orderBy: { order: 'asc' } },
          steps: { orderBy: { order: 'asc' } },
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items,
    };
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, isHidden: false },
      include: {
        tags: true,
        images: { orderBy: { uploadedAt: 'asc' } },
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  async create(dto: CreateRecipeDto, authorId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author || !author.isActive) {
      throw new NotFoundException('Author user not found or inactive');
    }

    return this.prisma.recipe.create({
      data: {
        title: dto.title,
        description: dto.description,
        stage: dto.stage,
        prepMinutes: dto.prepMinutes,
        cookMinutes: dto.cookMinutes,
        servings: dto.servings,
        allergens: dto.allergens ?? [],
        authorId,
        coverImageUrl: dto.coverImageUrl,
        tags: {
          create: (dto.tags ?? []).map((tag) => ({ value: tag })),
        },
        ingredients: {
          create: dto.ingredients.map((ingredient, index) => ({
            name: ingredient.name,
            amount: ingredient.amount,
            note: ingredient.note,
            order: index + 1,
          })),
        },
        steps: {
          create: dto.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => ({
              order: step.order,
              instruction: step.instruction,
            })),
        },
      },
      include: {
        tags: true,
        images: true,
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async addImage(
    recipeId: string,
    userId: string,
    file: UploadedImageFile,
    caption?: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.isHidden) {
      throw new NotFoundException('Recipe not found');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'recipes');
    mkdirSync(uploadDir, { recursive: true });

    const extension = extname(file.originalname).toLowerCase() || '.png';
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    writeFileSync(join(uploadDir, filename), file.buffer);

    const imageUrl = `/uploads/recipes/${filename}`;

    const created = await this.prisma.recipeImage.create({
      data: {
        recipeId,
        uploadedById: userId,
        url: imageUrl,
        caption,
      },
    });

    if (!recipe.coverImageUrl) {
      await this.prisma.recipe.update({
        where: { id: recipeId },
        data: { coverImageUrl: imageUrl },
      });
    }

    return created;
  }
}
