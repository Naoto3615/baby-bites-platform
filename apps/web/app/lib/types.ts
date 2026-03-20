export type FeedingStage = 'STAGE_5_6' | 'STAGE_7_8' | 'STAGE_9_11' | 'STAGE_12_18';
export type UserRole = 'PARENT' | 'MODERATOR' | 'ADMIN';
export type ReportTargetType = 'RECIPE' | 'COMMUNITY_POST' | 'COMMUNITY_COMMENT' | 'USER';
export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
export type ModerationActionType =
  | 'HIDE_CONTENT'
  | 'UNHIDE_CONTENT'
  | 'WARN_USER'
  | 'SUSPEND_USER'
  | 'RESTORE_USER'
  | 'DELETE_CONTENT';

export type Recipe = {
  id: string;
  title: string;
  description: string;
  stage: FeedingStage;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  coverImageUrl?: string | null;
  allergens: string[];
  tags: { id: string; value: string }[];
  images?: {
    id: string;
    url: string;
    caption?: string | null;
  }[];
  ingredients?: {
    id: string;
    name: string;
    amount: string;
    note?: string | null;
    order: number;
  }[];
  steps?: {
    id: string;
    order: number;
    instruction: string;
  }[];
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  _count?: { posts: number };
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  stage?: FeedingStage;
  createdAt: string;
  author: { id: string; displayName: string };
  topic: { id: string; name: string };
  _count?: { comments: number };
};

export type NearbyItem = {
  name: string;
  vicinity: string;
  rating?: number;
  placeId?: string;
};

export type NewsItem = {
  title: string;
  link: string;
  snippet: string;
  source: string;
};

export type AuthUser = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
};

export type ReportItem = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  detail?: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; displayName: string };
  resolver?: { id: string; displayName: string } | null;
  actions: {
    id: string;
    actionType: ModerationActionType;
    note?: string | null;
    createdAt: string;
    moderator: { id: string; displayName: string };
  }[];
};
