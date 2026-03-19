'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  devLogin,
  getAuthMe,
  getGoogleAuthUrl,
  getLineAuthUrl,
  logout,
  oauthLogin,
  updateMyProfile,
} from '../lib/client-api';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../lib/auth-client';
import { AuthUser } from '../lib/types';

export default function AccountPage() {
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [me, setMe] = useState<AuthUser | null>(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [lineUrl, setLineUrl] = useState('');
  const [message, setMessage] = useState('');

  const [devDisplayName, setDevDisplayName] = useState('デモ保護者');
  const [devEmail, setDevEmail] = useState('demo@example.com');
  const [devProviderUserId, setDevProviderUserId] = useState('demo-user');

  const [oauthProvider, setOauthProvider] = useState<'GOOGLE' | 'LINE'>('GOOGLE');
  const [oauthToken, setOauthToken] = useState('');

  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');

  const refreshMe = async (accessToken: string) => {
    try {
      const currentUser = await getAuthMe(accessToken);
      setMe(currentUser);
      setProfileDisplayName(currentUser.displayName);
      setProfileBio((currentUser as { bio?: string }).bio ?? '');
      setProfileAvatarUrl(currentUser.avatarUrl ?? '');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ユーザー情報取得に失敗しました');
    }
  };

  useEffect(() => {
    void getGoogleAuthUrl()
      .then((result) => setGoogleUrl(result.url))
      .catch(() => setGoogleUrl(''));
    void getLineAuthUrl()
      .then((result) => setLineUrl(result.url))
      .catch(() => setLineUrl(''));
  }, []);

  const handleRefreshMe = async () => {
    if (!token) {
      setMessage('先にログインしてください');
      return;
    }
    await refreshMe(token);
  };

  const handleDevLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      const result = await devLogin({
        displayName: devDisplayName,
        email: devEmail || undefined,
        providerUserId: devProviderUserId || undefined,
      });
      setStoredAccessToken(result.accessToken);
      setToken(result.accessToken);
      setMe(result.user);
      setProfileDisplayName(result.user.displayName);
      setProfileAvatarUrl(result.user.avatarUrl ?? '');
      setMessage(`ログインしました: ${result.user.displayName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ログインに失敗しました');
    }
  };

  const handleOauthLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      const result = await oauthLogin({
        provider: oauthProvider,
        idToken: oauthProvider === 'GOOGLE' ? oauthToken : undefined,
        accessToken: oauthProvider === 'LINE' ? oauthToken : undefined,
      });
      setStoredAccessToken(result.accessToken);
      setToken(result.accessToken);
      setMe(result.user);
      setProfileDisplayName(result.user.displayName);
      setProfileAvatarUrl(result.user.avatarUrl ?? '');
      setMessage(`OAuthログインしました: ${result.user.displayName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OAuthログインに失敗しました');
    }
  };

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage('先にログインしてください');
      return;
    }

    try {
      await updateMyProfile(token, {
        displayName: profileDisplayName,
        bio: profileBio,
        avatarUrl: profileAvatarUrl,
      });
      await refreshMe(token);
      setMessage('プロフィールを更新しました');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'プロフィール更新に失敗しました');
    }
  };

  const handleLogout = async () => {
    if (!token) {
      return;
    }

    try {
      await logout(token);
    } catch {
      // noop
    }

    clearStoredAccessToken();
    setToken(null);
    setMe(null);
    setMessage('ログアウトしました');
  };

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">FAMILY ACCOUNT</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">家族アカウント設定</h1>
        <p className="muted mt-3 text-sm md:text-base">
          ログイン方法の設定、プロフィール更新、アカウント確認をひとつの画面で行えます。
        </p>
        {message ? <p className="notice mt-4 text-sm">{message}</p> : null}
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">開発用ログイン</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleDevLogin}>
            <input
              className="field px-3 py-2 text-sm"
              placeholder="表示名"
              value={devDisplayName}
              onChange={(e) => setDevDisplayName(e.target.value)}
            />
            <input
              className="field px-3 py-2 text-sm"
              placeholder="メール"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
            />
            <input
              className="field px-3 py-2 text-sm"
              placeholder="providerUserId"
              value={devProviderUserId}
              onChange={(e) => setDevProviderUserId(e.target.value)}
            />
            <button className="btn-main px-4 py-2 text-sm" type="submit">
              ログイン
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">モデレーターは `moderator-user`、管理者は `admin-user` でログイン可能です。</p>
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Google/LINE OAuth</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleOauthLogin}>
            <select
              className="field px-3 py-2 text-sm"
              value={oauthProvider}
              onChange={(e) => setOauthProvider(e.target.value as 'GOOGLE' | 'LINE')}
            >
              <option value="GOOGLE">GOOGLE</option>
              <option value="LINE">LINE</option>
            </select>
            <textarea
              className="field min-h-24 px-3 py-2 text-sm"
              placeholder="id_token または access_token"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
            />
            <button className="btn-main px-4 py-2 text-sm" type="submit">
              トークンでログイン
            </button>
          </form>
          <div className="mt-3 grid gap-1 text-xs text-slate-300">
            {googleUrl ? <a href={googleUrl} target="_blank" rel="noreferrer" className="text-cyan-200 hover:underline">GoogleログインURLを開く</a> : null}
            {lineUrl ? <a href={lineUrl} target="_blank" rel="noreferrer" className="text-cyan-200 hover:underline">LINEログインURLを開く</a> : null}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">現在のユーザー</h2>
          {me ? (
            <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">
              {JSON.stringify(me, null, 2)}
            </pre>
          ) : (
            <p className="mt-3 text-sm text-slate-300">未ログインです。</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="btn-sub px-4 py-2 text-sm"
              type="button"
              onClick={() => void handleRefreshMe()}
              disabled={!token}
            >
              ユーザー再取得
            </button>
            <button
              className="btn-sub px-4 py-2 text-sm"
              type="button"
              onClick={handleLogout}
              disabled={!token}
            >
              ログアウト
            </button>
          </div>
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">プロフィール更新</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleUpdateProfile}>
            <input
              className="field px-3 py-2 text-sm"
              placeholder="表示名"
              value={profileDisplayName}
              onChange={(e) => setProfileDisplayName(e.target.value)}
            />
            <input
              className="field px-3 py-2 text-sm"
              placeholder="アバターURL"
              value={profileAvatarUrl}
              onChange={(e) => setProfileAvatarUrl(e.target.value)}
            />
            <textarea
              className="field min-h-24 px-3 py-2 text-sm"
              placeholder="自己紹介"
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
            />
            <button className="btn-main px-4 py-2 text-sm" type="submit" disabled={!token}>
              更新
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
