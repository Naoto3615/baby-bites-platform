import Link from 'next/link';
import { getRecipes } from '../lib/api';

const stageLabel: Record<string, string> = {
  STAGE_5_6: '5〜6ヶ月',
  STAGE_7_8: '7〜8ヶ月',
  STAGE_9_11: '9〜11ヶ月',
  STAGE_12_18: '12〜18ヶ月',
};

export default async function RecipesPage() {
  const recipes = await getRecipes();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">BABY FOOD RECIPES</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">月齢で選べる離乳食レシピ</h1>
        <p className="muted mt-3 text-sm md:text-base">
          「今日どれを作ればいい？」に迷わないよう、月齢・調理時間・タグで探しやすくしています。
        </p>
      </section>

      <section className="mt-5 grid-cards">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="group block">
            <article className="surface rounded-2xl p-4 transition group-hover:-translate-y-0.5">
              {recipe.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${apiBase}${recipe.coverImageUrl}`}
                  alt={recipe.title}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="text-xs text-cyan-200">対象: {stageLabel[recipe.stage] ?? recipe.stage}</p>
              <h2 className="mt-2 text-lg font-semibold">{recipe.title}</h2>
              <p className="muted mt-2 text-sm">{recipe.description}</p>
              <p className="mt-3 text-xs text-slate-400">
                準備 {recipe.prepMinutes}分 / 調理 {recipe.cookMinutes}分 / {recipe.servings}食分
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300">
                    #{tag.value}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-cyan-200 group-hover:underline">詳細を見る →</p>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
