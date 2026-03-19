import { getNearbyResources, getNewsResources } from '../lib/api';

export default async function ResourcesPage() {
  const [nearby, news] = await Promise.all([getNearbyResources(), getNewsResources()]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs tracking-[0.16em] text-cyan-300">EXTERNAL RESOURCES</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">外部データ連携</h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Google / Yahoo のAPIをバックエンド経由で取得し、子育て世代に役立つ情報を表示する設計です。
        </p>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">近隣スポット（Google Places）</h2>
          <ul className="mt-3 grid gap-2">
            {nearby.map((item, index) => (
              <li key={`${item.name}-${index}`} className="rounded-xl border border-slate-700/70 p-3">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-slate-300">{item.vicinity}</p>
                {typeof item.rating === 'number' ? <p className="mt-1 text-xs text-slate-400">評価: {item.rating}</p> : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">関連記事（Yahoo / Google）</h2>
          <ul className="mt-3 grid gap-2">
            {news.map((item, index) => (
              <li key={`${item.link}-${index}`} className="rounded-xl border border-slate-700/70 p-3">
                <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-200 hover:underline">
                  {item.title}
                </a>
                <p className="mt-1 text-xs text-slate-300">{item.snippet}</p>
                <p className="mt-1 text-xs text-slate-400">source: {item.source}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
