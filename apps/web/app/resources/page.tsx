import { getNearbyResources, getNewsResources } from '../lib/api';

export default async function ResourcesPage() {
  const [nearby, news] = await Promise.all([
    getNearbyResources(),
    getNewsResources(),
  ]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">LIFE SUPPORT DATA</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">子育てに役立つ地域情報</h1>
        <p className="muted mt-3 text-sm md:text-base">
          病院や施設、最新記事など、子育て中に気になる情報をまとめて確認できます。
        </p>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">近くのスポット</h2>
          <ul className="mt-3 grid gap-2">
            {nearby.map((item, index) => (
              <li key={`${item.name}-${index}`} className="rounded-xl border border-slate-700/70 p-3">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="muted mt-1 text-xs">{item.vicinity}</p>
                {typeof item.rating === 'number' ? (
                  <p className="mt-1 text-xs text-slate-400">評価: {item.rating}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">子育て関連記事</h2>
          <ul className="mt-3 grid gap-2">
            {news.map((item, index) => (
              <li key={`${item.link}-${index}`} className="rounded-xl border border-slate-700/70 p-3">
                <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-200 hover:underline">
                  {item.title}
                </a>
                <p className="muted mt-1 text-xs">{item.snippet}</p>
                <p className="mt-1 text-xs text-slate-400">source: {item.source}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
