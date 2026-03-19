import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RequestWithUser } from '../types/auth-user.type';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const user = await this.authService.validateAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request.user = user;
    request.accessToken = token;
    return true;
  }
}
