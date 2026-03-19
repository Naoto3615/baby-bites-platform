import Link from 'next/link';
import { getCommunityPosts, getRecipes, getTopics } from './lib/api';

export default async function HomePage() {
  const [recipes, topics, posts] = await Promise.all([getRecipes(), getTopics(), getCommunityPosts()]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs tracking-[0.18em] text-cyan-300">BABY FOOD + COMMUNITY + RESOURCES</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
          子育て世代向けの離乳食プラットフォームを、モダン構成で本格開発
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
          月齢別レシピ、コミュニティ、外部データ連携（Google/Yahoo）を統合したプロダクトの初期実装です。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/recipes" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">
            レシピを見る
          </Link>
          <Link href="/community" className="rounded-full border border-slate-500 px-4 py-2 text-sm font-semibold">
            コミュニティを見る
          </Link>
          <Link href="/resources" className="rounded-full border border-slate-500 px-4 py-2 text-sm font-semibold">
            生活支援情報を見る
          </Link>
          <Link href="/studio" className="rounded-full border border-slate-500 px-4 py-2 text-sm font-semibold">
            投稿スタジオ
          </Link>
          <Link href="/account" className="rounded-full border border-slate-500 px-4 py-2 text-sm font-semibold">
            アカウント
          </Link>
        </div>
      </section>

      <section className="mt-5 grid-cards">
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Recipes</p>
          <h2 className="mt-2 text-2xl font-semibold">{recipes.length}</h2>
          <p className="mt-2 text-sm text-slate-300">離乳食レシピ登録数（表示中）</p>
        </article>
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Topics</p>
          <h2 className="mt-2 text-2xl font-semibold">{topics.length}</h2>
          <p className="mt-2 text-sm text-slate-300">コミュニティトピック数</p>
        </article>
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Posts</p>
          <h2 className="mt-2 text-2xl font-semibold">{posts.length}</h2>
          <p className="mt-2 text-sm text-slate-300">最新投稿数（表示中）</p>
        </article>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h3 className="text-lg font-semibold">開発方針</h3>
          <ul className="mt-2 grid gap-2 text-sm text-slate-300">
            <li>• Next.js App Router + NestJS + PostgreSQL</li>
            <li>• Prismaによるスキーマ駆動開発</li>
            <li>• 外部APIキーをサーバー側で保護</li>
            <li>• コミュニティはモデレーション前提で拡張</li>
          </ul>
        </article>
        <article className="surface rounded-2xl p-4">
          <h3 className="text-lg font-semibold">次フェーズ候補</h3>
          <ul className="mt-2 grid gap-2 text-sm text-slate-300">
            <li>• OAuth認証（Google/LINE）</li>
            <li>• 通報・ブロック・管理画面</li>
            <li>• 献立生成と買い物リスト</li>
            <li>• レコメンドと通知最適化</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
