import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { UploadRecipeImageDto } from './dto/upload-recipe-image.dto';
import { RecipesService } from './recipes.service';
import type { UploadedImageFile } from './uploaded-image-file.type';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: '離乳食レシピ一覧を取得' })
  findAll(@Query() query: RecipeQueryDto) {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '離乳食レシピ詳細を取得' })
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '離乳食レシピを作成（ログイン必須）' })
  create(@Body() dto: CreateRecipeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.recipesService.create(dto, user.id);
  }

  @Post(':id/images')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'レシピ画像をアップロード（ログイン必須）' })
  uploadImage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadRecipeImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .addFileTypeValidator({ fileType: /image\/(png|jpeg|jpg|webp|gif)/ })
        .build({ fileIsRequired: true }),
    )
    file: UploadedImageFile,
  ) {
    return this.recipesService.addImage(id, user.id, file, dto.caption);
  }
}
