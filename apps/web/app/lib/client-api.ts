import {
  AuthUser,
  ModerationActionType,
  ReportItem,
  ReportStatus,
  ReportTargetType,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type JsonObject = Record<string, unknown>;

async function request<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function devLogin(payload: {
  displayName: string;
  email?: string;
  providerUserId?: string;
  avatarUrl?: string;
}) {
  return request<{ accessToken: string; user: AuthUser; expiresAt: string }>(
    '/auth/dev-login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function oauthLogin(payload: {
  provider: 'GOOGLE' | 'LINE';
  idToken?: string;
  accessToken?: string;
  displayNameFallback?: string;
}) {
  return request<{ accessToken: string; user: AuthUser; expiresAt: string }>(
    '/auth/oauth-login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function getAuthMe(accessToken: string) {
  return request<AuthUser & { authProviders?: JsonObject[] }>('/auth/me', {}, accessToken);
}

export async function logout(accessToken: string) {
  return request<{ success: boolean }>(
    '/auth/logout',
    {
      method: 'POST',
    },
    accessToken,
  );
}

export async function updateMyProfile(
  accessToken: string,
  payload: { displayName?: string; avatarUrl?: string; bio?: string },
) {
  return request<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, accessToken);
}

export async function createRecipe(
  accessToken: string,
  payload: {
    title: string;
    description: string;
    stage: 'STAGE_5_6' | 'STAGE_7_8' | 'STAGE_9_11' | 'STAGE_12_18';
    prepMinutes: number;
    cookMinutes: number;
    servings: number;
    allergens?: string[];
    tags?: string[];
    coverImageUrl?: string;
    ingredients: { name: string; amount: string; note?: string }[];
    steps: { order: number; instruction: string }[];
  },
) {
  return request<{ id: string }>(
    '/recipes',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function uploadRecipeImage(
  accessToken: string,
  recipeId: string,
  file: File,
  caption?: string,
) {
  const body = new FormData();
  body.append('image', file);
  if (caption) {
    body.append('caption', caption);
  }

  return request<{ id: string; url: string }>(
    `/recipes/${recipeId}/images`,
    {
      method: 'POST',
      body,
    },
    accessToken,
  );
}

export async function createReport(
  accessToken: string,
  payload: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    detail?: string;
  },
) {
  return request<{ id: string }>('/moderation/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

export async function getModerationReports(accessToken: string) {
  return request<{ items: ReportItem[] }>('/moderation/reports?limit=50', {}, accessToken);
}

export async function getModerationDashboard(accessToken: string) {
  return request<{ reports: { open: number; underReview: number; resolved: number; rejected: number } }>(
    '/moderation/dashboard',
    {},
    accessToken,
  );
}

export async function updateReport(
  accessToken: string,
  reportId: string,
  payload: {
    status?: ReportStatus;
    actionType?: ModerationActionType;
    resolutionNote?: string;
    actionNote?: string;
  },
) {
  return request<ReportItem>(
    `/moderation/reports/${reportId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function getGoogleAuthUrl() {
  return request<{ url: string; state: string }>('/auth/google/url');
}

export async function getLineAuthUrl() {
  return request<{ url: string; state: string }>('/auth/line/url');
}
