import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'ログインユーザー情報を取得' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'ログインユーザーのプロフィール更新' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Get()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'ユーザー一覧（モデレーター以上）' })
  listUsers(@Query() query: UserQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ユーザーロール/有効状態を更新（管理者のみ）' })
  adminUpdateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto);
  }
}
