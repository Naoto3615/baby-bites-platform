import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUrlQueryDto } from './dto/auth-url-query.dto';
import { DevLoginDto } from './dto/dev-login.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/auth-user.type';

function buildClientMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/url')
  @ApiOperation({ summary: 'Google OAuthログインURLを生成' })
  getGoogleAuthUrl(@Query() query: AuthUrlQueryDto) {
    return this.authService.getGoogleAuthUrl(query.state);
  }

  @Get('line/url')
  @ApiOperation({ summary: 'LINE OAuthログインURLを生成' })
  getLineAuthUrl(@Query() query: AuthUrlQueryDto) {
    return this.authService.getLineAuthUrl(query.state);
  }

  @Post('dev-login')
  @ApiOperation({ summary: '開発用ログイン（ローカル検証向け）' })
  devLogin(@Body() dto: DevLoginDto, @Req() req: Request) {
    return this.authService.devLogin(dto, buildClientMeta(req));
  }

  @Post('oauth-login')
  @ApiOperation({ summary: 'Google/LINEアクセストークンでログイン' })
  oauthLogin(@Body() dto: OauthLoginDto, @Req() req: Request) {
    return this.authService.oauthLogin(dto, buildClientMeta(req));
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '現在のログインユーザー情報を取得' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '現在のセッションをログアウト' })
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }
}
