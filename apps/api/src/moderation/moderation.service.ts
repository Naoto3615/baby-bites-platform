import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  Prisma,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    if (targetType === ReportTargetType.RECIPE) {
      const row = await this.prisma.recipe.findUnique({
        where: { id: targetId },
      });
      if (!row) throw new NotFoundException('Recipe not found');
      return;
    }

    if (targetType === ReportTargetType.COMMUNITY_POST) {
      const row = await this.prisma.communityPost.findUnique({
        where: { id: targetId },
      });
      if (!row) throw new NotFoundException('Community post not found');
      return;
    }

    if (targetType === ReportTargetType.COMMUNITY_COMMENT) {
      const row = await this.prisma.communityComment.findUnique({
        where: { id: targetId },
      });
      if (!row) throw new NotFoundException('Community comment not found');
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');
  }

  private async applyAction(
    tx: Prisma.TransactionClient,
    targetType: ReportTargetType,
    targetId: string,
    actionType: ModerationActionType,
  ) {
    if (targetType === ReportTargetType.RECIPE) {
      if (
        actionType === ModerationActionType.HIDE_CONTENT ||
        actionType === ModerationActionType.DELETE_CONTENT
      ) {
        await tx.recipe.update({
          where: { id: targetId },
          data: { isHidden: true, published: false },
        });
        return;
      }

      if (actionType === ModerationActionType.UNHIDE_CONTENT) {
        await tx.recipe.update({
          where: { id: targetId },
          data: { isHidden: false, published: true },
        });
        return;
      }
    }

    if (targetType === ReportTargetType.COMMUNITY_POST) {
      if (
        actionType === ModerationActionType.HIDE_CONTENT ||
        actionType === ModerationActionType.DELETE_CONTENT
      ) {
        await tx.communityPost.update({
          where: { id: targetId },
          data: { isHidden: true },
        });
        return;
      }

      if (actionType === ModerationActionType.UNHIDE_CONTENT) {
        await tx.communityPost.update({
          where: { id: targetId },
          data: { isHidden: false },
        });
        return;
      }
    }

    if (targetType === ReportTargetType.COMMUNITY_COMMENT) {
      if (
        actionType === ModerationActionType.HIDE_CONTENT ||
        actionType === ModerationActionType.DELETE_CONTENT
      ) {
        await tx.communityComment.update({
          where: { id: targetId },
          data: { isHidden: true },
        });
        return;
      }

      if (actionType === ModerationActionType.UNHIDE_CONTENT) {
        await tx.communityComment.update({
          where: { id: targetId },
          data: { isHidden: false },
        });
        return;
      }
    }

    if (targetType === ReportTargetType.USER) {
      if (actionType === ModerationActionType.SUSPEND_USER) {
        await tx.user.update({
          where: { id: targetId },
          data: { isActive: false },
        });
        return;
      }

      if (actionType === ModerationActionType.RESTORE_USER) {
        await tx.user.update({
          where: { id: targetId },
          data: { isActive: true },
        });
        return;
      }

      if (actionType === ModerationActionType.WARN_USER) {
        return;
      }
    }

    throw new BadRequestException(
      `Action ${actionType} is not supported for ${targetType}`,
    );
  }

  async createReport(reporterId: string, dto: CreateReportDto) {
    await this.ensureTargetExists(dto.targetType, dto.targetId);

    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail,
      },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async listReports(query: ReportQueryDto) {
    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              displayName: true,
            },
          },
          resolver: {
            select: {
              id: true,
              displayName: true,
            },
          },
          actions: {
            orderBy: { createdAt: 'asc' },
            include: {
              moderator: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items,
    };
  }

  async updateReport(
    reportId: string,
    moderatorId: string,
    dto: UpdateReportDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const nextStatus = dto.status ?? report.status;
    const resolvedAt =
      nextStatus === ReportStatus.RESOLVED ||
      nextStatus === ReportStatus.REJECTED
        ? new Date()
        : null;

    return this.prisma.$transaction(async (tx) => {
      if (dto.actionType) {
        await this.applyAction(
          tx,
          report.targetType,
          report.targetId,
          dto.actionType,
        );

        await tx.moderationAction.create({
          data: {
            reportId: report.id,
            moderatorId,
            actionType: dto.actionType,
            targetType: report.targetType,
            targetId: report.targetId,
            note: dto.actionNote,
          },
        });
      }

      return tx.report.update({
        where: { id: report.id },
        data: {
          status: nextStatus,
          resolutionNote: dto.resolutionNote,
          resolverId: nextStatus === ReportStatus.OPEN ? null : moderatorId,
          resolvedAt,
        },
        include: {
          reporter: {
            select: {
              id: true,
              displayName: true,
            },
          },
          resolver: {
            select: {
              id: true,
              displayName: true,
            },
          },
          actions: {
            orderBy: { createdAt: 'asc' },
            include: {
              moderator: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async getDashboard() {
    const [openCount, reviewingCount, resolvedCount, rejectedCount] =
      await this.prisma.$transaction([
        this.prisma.report.count({ where: { status: ReportStatus.OPEN } }),
        this.prisma.report.count({
          where: { status: ReportStatus.UNDER_REVIEW },
        }),
        this.prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
        this.prisma.report.count({ where: { status: ReportStatus.REJECTED } }),
      ]);

    return {
      reports: {
        open: openCount,
        underReview: reviewingCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
      },
    };
  }
}
