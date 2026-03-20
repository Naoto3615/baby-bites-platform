import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRecipeById } from '../../lib/api';

const stageLabel: Record<string, string> = {
  STAGE_5_6: '5〜6ヶ月',
  STAGE_7_8: '7〜8ヶ月',
  STAGE_9_11: '9〜11ヶ月',
  STAGE_12_18: '12〜18ヶ月',
};

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const images = recipe.images ?? [];
  const ingredients = [...(recipe.ingredients ?? [])].sort((a, b) => a.order - b.order);
  const steps = [...(recipe.steps ?? [])].sort((a, b) => a.order - b.order);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">RECIPE DETAIL</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">{recipe.title}</h1>
        <p className="mt-2 text-sm text-cyan-200">対象: {stageLabel[recipe.stage] ?? recipe.stage}</p>
        <p className="muted mt-3 text-sm md:text-base">{recipe.description}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>準備 {recipe.prepMinutes}分</span>
          <span>•</span>
          <span>調理 {recipe.cookMinutes}分</span>
          <span>•</span>
          <span>{recipe.servings}食分</span>
          {recipe.author ? (
            <>
              <span>•</span>
              <span>投稿者: {recipe.author.displayName}</span>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <span key={tag.id} className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300">
              #{tag.value}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/recipes" className="btn-sub px-4 py-2 text-sm">
            レシピ一覧へ戻る
          </Link>
        </div>
      </section>

      {images.length > 0 ? (
        <section className="mt-5 grid gap-3 md:grid-cols-2">
          {images.map((image) => (
            <article key={image.id} className="surface rounded-2xl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${apiBase}${image.url}`}
                alt={image.caption ?? recipe.title}
                className="h-64 w-full rounded-xl object-cover"
              />
              {image.caption ? <p className="muted mt-2 text-xs">{image.caption}</p> : null}
            </article>
          ))}
        </section>
      ) : null}

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="font-[var(--font-display)] text-xl font-bold">材料</h2>
          {ingredients.length > 0 ? (
            <ol className="mt-3 grid gap-2 text-sm">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="rounded-xl border border-slate-600 px-3 py-2">
                  <p className="font-semibold">{ingredient.name}</p>
                  <p className="muted text-xs">{ingredient.amount}</p>
                  {ingredient.note ? <p className="muted text-xs">{ingredient.note}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted mt-3 text-sm">材料情報はまだ登録されていません。</p>
          )}
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="font-[var(--font-display)] text-xl font-bold">作り方</h2>
          {steps.length > 0 ? (
            <ol className="mt-3 grid gap-2 text-sm">
              {steps.map((step) => (
                <li key={step.id} className="rounded-xl border border-slate-600 px-3 py-2">
                  <p className="text-xs text-cyan-200">STEP {step.order}</p>
                  <p className="mt-1">{step.instruction}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted mt-3 text-sm">手順情報はまだ登録されていません。</p>
          )}
        </article>
      </section>
    </main>
  );
}
