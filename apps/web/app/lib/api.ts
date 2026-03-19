import { CommunityPost, NearbyItem, NewsItem, Recipe, Topic } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const fallbackRecipes: Recipe[] = [
  {
    id: 'sample-1',
    title: 'にんじんとじゃがいものやわらかペースト',
    description: '5〜6ヶ月向けの基本ペースト。',
    stage: 'STAGE_5_6',
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 4,
    allergens: [],
    tags: [{ id: 't1', value: '時短' }],
  },
];

const fallbackTopics: Topic[] = [
  {
    id: 'topic-sample',
    name: '5〜6ヶ月のスタート相談',
    description: '初期離乳食で迷ったことを共有',
    _count: { posts: 0 },
  },
];

const fallbackPosts: CommunityPost[] = [
  {
    id: 'post-sample',
    title: '離乳食の初日に何を準備しましたか？',
    body: 'うちでは冷凍トレーと小鍋を先にそろえました。',
    stage: 'STAGE_5_6',
    createdAt: new Date().toISOString(),
    author: { id: 'demo-user', displayName: 'デモ保護者' },
    topic: { id: 'topic-sample', name: '5〜6ヶ月のスタート相談' },
    _count: { comments: 0 },
  },
];

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const res = await fetch(`${API_BASE}/recipes?limit=12`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return data.items ?? fallbackRecipes;
  } catch {
    return fallbackRecipes;
  }
}

export async function getTopics(): Promise<Topic[]> {
  try {
    const res = await fetch(`${API_BASE}/community/topics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    return await res.json();
  } catch {
    return fallbackTopics;
  }
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const res = await fetch(`${API_BASE}/community/posts?limit=10`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return data.items ?? fallbackPosts;
  } catch {
    return fallbackPosts;
  }
}

export async function getNearbyResources(): Promise<NearbyItem[]> {
  try {
    const res = await fetch(`${API_BASE}/resources/nearby?lat=35.681236&lng=139.767125&keyword=小児科`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return data.data?.items ?? [];
  } catch {
    return [
      { name: 'サンプル小児科クリニック', vicinity: '東京都内', rating: 4.2 },
      { name: 'サンプル授乳室', vicinity: '駅前施設', rating: 4.0 },
    ];
  }
}

export async function getNewsResources(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_BASE}/resources/news?query=離乳食`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return data.data?.items ?? [];
  } catch {
    return [
      {
        title: '離乳食の基本ガイド（サンプル）',
        link: 'https://naoto3615.github.io/',
        snippet: 'API未接続時のサンプル表示です。',
        source: 'fallback',
      },
    ];
  }
}
