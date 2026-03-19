import Link from 'next/link';
import { getCommunityPosts, getRecipes, getTopics } from './lib/api';

export default async function HomePage() {
  const [recipes, topics, posts] = await Promise.all([
    getRecipes(),
    getTopics(),
    getCommunityPosts(),
  ]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-9">
        <p className="eyebrow">FOR NEW MOMS & DADS</p>
        <h1 className="mt-3 max-w-3xl font-[var(--font-display)] text-3xl font-extrabold leading-tight md:text-5xl">
          はじめての離乳食を、
          <br />
          やさしく、迷わず、続けられる形に。
        </h1>
        <p className="muted mt-4 max-w-3xl text-sm md:text-base">
          忙しい毎日の中でも「今日これなら作れそう」と思えるレシピ、同じ悩みを持つ保護者との相談、
          近くで使える子育て情報をひとつにまとめました。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/recipes" className="btn-main px-4 py-2 text-sm">
            レシピを探す
          </Link>
          <Link href="/community" className="btn-sub px-4 py-2 text-sm">
            相談ひろばを見る
          </Link>
          <Link href="/resources" className="btn-sub px-4 py-2 text-sm">
            お役立ち情報を見る
          </Link>
          <Link href="/studio" className="btn-sub px-4 py-2 text-sm">
            レシピを投稿する
          </Link>
        </div>
      </section>

      <section className="mt-5 grid-cards">
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">公開レシピ</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-extrabold">{recipes.length}</h2>
          <p className="muted mt-2 text-sm">月齢に合わせて選べるレシピ数</p>
        </article>
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">相談トピック</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-extrabold">{topics.length}</h2>
          <p className="muted mt-2 text-sm">悩み別に相談できるテーマ数</p>
        </article>
        <article className="surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">コミュニティ投稿</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-extrabold">{posts.length}</h2>
          <p className="muted mt-2 text-sm">最近のリアルな体験シェア</p>
        </article>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h3 className="font-[var(--font-display)] text-lg font-bold">新米ママ・パパ向けに大切にしていること</h3>
          <ul className="muted mt-3 grid gap-2 text-sm">
            <li>・月齢とアレルゲンを先に確認して、迷いを減らす</li>
            <li>・平日でも作れる時短レシピを中心にする</li>
            <li>・「これで合ってる？」を相談できる場を用意する</li>
            <li>・情報は見つけやすく、やさしい言葉で届ける</li>
          </ul>
        </article>
        <article className="surface rounded-2xl p-4">
          <h3 className="font-[var(--font-display)] text-lg font-bold">これから追加予定の機能</h3>
          <ul className="muted mt-3 grid gap-2 text-sm">
            <li>・お子さまの記録に合わせたおすすめ献立</li>
            <li>・1週間の買い物リスト自動作成</li>
            <li>・アレルギー対応の材料置き換え提案</li>
            <li>・家族で共有できる食事メモ</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
