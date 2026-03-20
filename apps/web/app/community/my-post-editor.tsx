'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import {
  getMyCommunityPosts,
  updateMyCommunityPost,
} from '../lib/client-api';
import { getStoredAccessToken } from '../lib/auth-client';
import { CommunityPost, FeedingStage } from '../lib/types';

const stages: FeedingStage[] = [
  'STAGE_5_6',
  'STAGE_7_8',
  'STAGE_9_11',
  'STAGE_12_18',
];

export default function MyPostEditor() {
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [message, setMessage] = useState('');
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostBody, setEditPostBody] = useState('');
  const [editPostStage, setEditPostStage] = useState<FeedingStage | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPost = useMemo(
    () => myPosts.find((post) => post.id === selectedPostId) ?? null,
    [myPosts, selectedPostId],
  );

  const applyPostToEditFields = (post: CommunityPost) => {
    setSelectedPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostBody(post.body);
    setEditPostStage(post.stage ?? '');
  };

  const loadMyPosts = async () => {
    const latestToken = getStoredAccessToken();
    setToken(latestToken);

    if (!latestToken) {
      setMessage('投稿の編集にはログインが必要です。');
      setMyPosts([]);
      setSelectedPostId('');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getMyCommunityPosts(latestToken);
      setMyPosts(result.items);

      if (result.items.length === 0) {
        setSelectedPostId('');
        setMessage('編集できる自分の投稿がまだありません。');
        return;
      }

      const target =
        result.items.find((post) => post.id === selectedPostId) ?? result.items[0];
      applyPostToEditFields(target);
      setMessage(`自分の投稿を読み込みました（${result.items.length}件）。`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '投稿の読み込みに失敗しました。',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage('投稿の編集にはログインが必要です。');
      return;
    }

    if (!selectedPost) {
      setMessage('編集する投稿を選択してください。');
      return;
    }

    setIsLoading(true);
    try {
      await updateMyCommunityPost(token, selectedPost.id, {
        title: editPostTitle,
        body: editPostBody,
        stage: editPostStage === '' ? undefined : editPostStage,
      });
      setMessage(`投稿を更新しました: ${editPostTitle}`);
      await loadMyPosts();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '投稿の更新に失敗しました。',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-5">
      <article className="surface rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">自分の投稿を編集</h2>
          <button
            className="btn-sub px-3 py-1.5 text-xs"
            type="button"
            onClick={() => void loadMyPosts()}
            disabled={isLoading}
          >
            {isLoading ? '読み込み中...' : '読み込む'}
          </button>
        </div>

        {!token ? (
          <p className="muted mt-3 text-sm">
            <Link href="/account" className="underline">
              Account
            </Link>
            でログイン後、「読み込む」を押すと自分の投稿を編集できます。
          </p>
        ) : null}

        <form className="mt-3 grid gap-2" onSubmit={handleUpdatePost}>
          <select
            className="field px-3 py-2 text-sm"
            value={selectedPostId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPostId(id);
              const post = myPosts.find((item) => item.id === id);
              if (post) {
                applyPostToEditFields(post);
              }
            }}
          >
            <option value="">編集する投稿を選択</option>
            {myPosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>

          <input
            className="field px-3 py-2 text-sm"
            placeholder="タイトル"
            value={editPostTitle}
            onChange={(e) => setEditPostTitle(e.target.value)}
          />

          <textarea
            className="field min-h-24 px-3 py-2 text-sm"
            placeholder="本文"
            value={editPostBody}
            onChange={(e) => setEditPostBody(e.target.value)}
          />

          <select
            className="field px-3 py-2 text-sm"
            value={editPostStage}
            onChange={(e) => setEditPostStage(e.target.value as FeedingStage | '')}
          >
            <option value="">月齢未設定</option>
            {stages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            className="btn-main px-4 py-2 text-sm"
            type="submit"
            disabled={!token || !selectedPostId || isLoading}
          >
            投稿を更新
          </button>
        </form>

        {message ? <p className="notice mt-3 text-sm">{message}</p> : null}
      </article>
    </section>
  );
}
