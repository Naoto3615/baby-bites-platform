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
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '通報を作成' })
  createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(user.id, dto);
  }

  @Get('reports')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: '通報一覧を取得（モデレーター以上）' })
  listReports(@Query() query: ReportQueryDto) {
    return this.moderationService.listReports(query);
  }

  @Patch('reports/:id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: '通報対応を更新（モデレーター以上）' })
  updateReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReportDto,
  ) {
    return this.moderationService.updateReport(id, user.id, dto);
  }

  @Get('dashboard')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'モデレーションダッシュボード集計' })
  getDashboard() {
    return this.moderationService.getDashboard();
  }
}
