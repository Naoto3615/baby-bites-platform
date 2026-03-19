import { UserRole } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
};

export type RequestWithUser = Request & {
  user: AuthenticatedUser;
  accessToken?: string;
};
