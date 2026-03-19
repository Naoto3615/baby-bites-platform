import { HttpService } from '@nestjs/axios';
import { AuthProvider, Prisma, UserRole } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { AuthenticatedUser } from './types/auth-user.type';

type SessionMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type GoogleTokenInfoResponse = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

type LineProfileResponse = {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
};

type ProviderProfile = {
  provider: AuthProvider;
  providerUserId: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  rawProfile: Prisma.InputJsonValue;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  private getSessionSecret(): string {
    return (
      this.config.get<string>('APP_SESSION_SECRET') ??
      'dev-session-secret-change-in-production'
    );
  }

  private getSessionTtlHours(): number {
    const raw = this.config.get<string>('SESSION_TTL_HOURS') ?? '168';
    const parsed = Number(raw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 168;
    }
    return parsed;
  }

  private signSessionId(sessionId: string): string {
    return createHmac('sha256', this.getSessionSecret())
      .update(sessionId)
      .digest('hex');
  }

  private secureEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private issueTokenFromSessionId(sessionId: string): string {
    return `${sessionId}.${this.signSessionId(sessionId)}`;
  }

  private extractAccessToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private serializeUser(user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: UserRole;
    isActive: boolean;
  }): AuthenticatedUser {
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
    };
  }

  private async createSession(userId: string, meta?: SessionMeta) {
    const sessionId = randomUUID();
    const accessToken = this.issueTokenFromSessionId(sessionId);
    const tokenHash = this.hashToken(accessToken);
    const expiresAt = new Date(
      Date.now() + this.getSessionTtlHours() * 60 * 60 * 1000,
    );

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId,
        tokenHash,
        expiresAt,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    return { accessToken, expiresAt };
  }

  private async upsertUserFromProvider(profile: ProviderProfile) {
    const existing = await this.prisma.userAuthProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
        },
      },
      include: { user: true },
    });

    if (existing) {
      const user = await this.prisma.user.update({
        where: { id: existing.userId },
        data: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          lastLoginAt: new Date(),
        },
      });

      await this.prisma.userAuthProvider.update({
        where: { id: existing.id },
        data: {
          email: profile.email,
          rawProfile: profile.rawProfile,
        },
      });

      return user;
    }

    return this.prisma.user.create({
      data: {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        lastLoginAt: new Date(),
        authProviders: {
          create: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            email: profile.email,
            rawProfile: profile.rawProfile,
          },
        },
      },
    });
  }

  private async verifyGoogleToken(
    dto: OauthLoginDto,
  ): Promise<ProviderProfile> {
    const token = dto.idToken ?? dto.accessToken;
    if (!token) {
      throw new BadRequestException(
        'Google login requires idToken or accessToken',
      );
    }

    const response = await firstValueFrom(
      this.http.get<GoogleTokenInfoResponse>(
        'https://oauth2.googleapis.com/tokeninfo',
        {
          params: dto.idToken ? { id_token: token } : { access_token: token },
        },
      ),
    );

    const profile = response.data;
    if (!profile.sub) {
      throw new UnauthorizedException('Failed to verify Google token');
    }

    return {
      provider: AuthProvider.GOOGLE,
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name ?? dto.displayNameFallback ?? 'Google User',
      avatarUrl: profile.picture,
      rawProfile: {
        sub: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
    };
  }

  private async verifyLineToken(dto: OauthLoginDto): Promise<ProviderProfile> {
    if (!dto.accessToken) {
      throw new BadRequestException('LINE login requires accessToken');
    }

    const response = await firstValueFrom(
      this.http.get<LineProfileResponse>('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${dto.accessToken}`,
        },
      }),
    );

    const profile = response.data;
    if (!profile.userId) {
      throw new UnauthorizedException('Failed to verify LINE token');
    }

    return {
      provider: AuthProvider.LINE,
      providerUserId: profile.userId,
      displayName:
        profile.displayName ?? dto.displayNameFallback ?? 'LINE User',
      avatarUrl: profile.pictureUrl,
      rawProfile: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      },
    };
  }

  private buildGoogleAuthUrl(state: string): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'GOOGLE_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI are required',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'openid profile email',
      state,
      include_granted_scopes: 'true',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private buildLineAuthUrl(state: string): string {
    const clientId = this.config.get<string>('LINE_CLIENT_ID');
    const redirectUri = this.config.get<string>('LINE_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'LINE_CLIENT_ID and LINE_OAUTH_REDIRECT_URI are required',
      );
    }

    const params = new URLSearchParams({
      response_type: 'token',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'profile openid',
      state,
      nonce: randomUUID(),
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  getGoogleAuthUrl(state?: string) {
    const oauthState = state ?? randomUUID();
    return {
      provider: AuthProvider.GOOGLE,
      state: oauthState,
      url: this.buildGoogleAuthUrl(oauthState),
    };
  }

  getLineAuthUrl(state?: string) {
    const oauthState = state ?? randomUUID();
    return {
      provider: AuthProvider.LINE,
      state: oauthState,
      url: this.buildLineAuthUrl(oauthState),
    };
  }

  async devLogin(dto: DevLoginDto, meta?: SessionMeta) {
    const providerUserId =
      dto.providerUserId ?? dto.email?.toLowerCase() ?? `dev-${randomUUID()}`;

    const user = await this.upsertUserFromProvider({
      provider: AuthProvider.DEV,
      providerUserId,
      email: dto.email,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      rawProfile: {
        providerUserId,
        email: dto.email,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
      },
    });

    const session = await this.createSession(user.id, meta);

    return {
      ...session,
      user: this.serializeUser(user),
    };
  }

  async oauthLogin(dto: OauthLoginDto, meta?: SessionMeta) {
    if (dto.provider === AuthProvider.DEV) {
      throw new BadRequestException(
        'DEV provider is not allowed on oauth-login',
      );
    }

    const profile =
      dto.provider === AuthProvider.GOOGLE
        ? await this.verifyGoogleToken(dto)
        : await this.verifyLineToken(dto);

    const user = await this.upsertUserFromProvider(profile);
    const session = await this.createSession(user.id, meta);

    return {
      ...session,
      user: this.serializeUser(user),
    };
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser | null> {
    const [sessionId, signature] = token.split('.');
    if (!sessionId || !signature) {
      return null;
    }

    const expectedSignature = this.signSessionId(sessionId);
    if (!this.secureEqual(signature, expectedSignature)) {
      return null;
    }

    const tokenHash = this.hashToken(token);
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    return this.serializeUser(session.user);
  }

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
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async logout(authorization?: string) {
    const token = this.extractAccessToken(authorization);
    if (!token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const tokenHash = this.hashToken(token);
    await this.prisma.userSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }
}
