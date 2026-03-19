'use client';

import { FormEvent, useState } from 'react';
import { createRecipe, uploadRecipeImage } from '../lib/client-api';
import { getStoredAccessToken } from '../lib/auth-client';
import { FeedingStage } from '../lib/types';

const stages: FeedingStage[] = ['STAGE_5_6', 'STAGE_7_8', 'STAGE_9_11', 'STAGE_12_18'];

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function StudioPage() {
  const [token] = useState<string | null>(() => getStoredAccessToken());
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('かぼちゃのやわらかペースト');
  const [description, setDescription] = useState('冷凍ストックしやすい基本レシピ');
  const [stage, setStage] = useState<FeedingStage>('STAGE_5_6');
  const [prepMinutes, setPrepMinutes] = useState(10);
  const [cookMinutes, setCookMinutes] = useState(12);
  const [servings, setServings] = useState(4);
  const [allergens, setAllergens] = useState('');
  const [tags, setTags] = useState('時短, 冷凍保存');
  const [ingredientsText, setIngredientsText] = useState('かぼちゃ|60g\n湯冷まし|適量');
  const [stepsText, setStepsText] = useState('やわらかく茹でる\nなめらかになるまでつぶす\n濃度を調整する');

  const [createdRecipeId, setCreatedRecipeId] = useState('');
  const [imageRecipeId, setImageRecipeId] = useState('');
  const [imageCaption, setImageCaption] = useState('完成イメージ');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleCreateRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage('先にAccountページでログインしてください');
      return;
    }

    try {
      const ingredientRows = parseLines(ingredientsText).map((line) => {
        const [name, amount, note] = line.split('|').map((part) => part.trim());
        return { name, amount, note: note || undefined };
      });

      const stepRows = parseLines(stepsText).map((instruction, index) => ({
        order: index + 1,
        instruction,
      }));

      const created = await createRecipe(token, {
        title,
        description,
        stage,
        prepMinutes,
        cookMinutes,
        servings,
        allergens: allergens
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        tags: tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        ingredients: ingredientRows,
        steps: stepRows,
      });

      setCreatedRecipeId(created.id);
      setImageRecipeId(created.id);
      setMessage(`レシピ作成完了: ${created.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'レシピ作成に失敗しました');
    }
  };

  const handleUploadImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage('先にログインしてください');
      return;
    }
    if (!imageRecipeId || !imageFile) {
      setMessage('recipeId と画像ファイルを指定してください');
      return;
    }

    try {
      const uploaded = await uploadRecipeImage(token, imageRecipeId, imageFile, imageCaption || undefined);
      setMessage(`画像アップロード完了: ${uploaded.url}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '画像アップロードに失敗しました');
    }
  };

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs tracking-[0.16em] text-cyan-300">STUDIO</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">レシピ投稿と画像アップロード</h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          認証済みユーザーでレシピ作成し、続けて画像をアップロードできます。
        </p>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">1. レシピ作成</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleCreateRecipe}>
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
            <textarea className="min-h-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明" />
            <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={stage} onChange={(e) => setStage(e.target.value as FeedingStage)}>
              {stages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" type="number" min={0} value={prepMinutes} onChange={(e) => setPrepMinutes(Number(e.target.value))} placeholder="準備" />
              <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" type="number" min={0} value={cookMinutes} onChange={(e) => setCookMinutes(Number(e.target.value))} placeholder="調理" />
              <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} placeholder="食分" />
            </div>
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="アレルゲン (カンマ区切り)" />
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ (カンマ区切り)" />
            <textarea className="min-h-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder="材料: 1行1件 (name|amount|note)" />
            <textarea className="min-h-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder="手順: 1行1件" />
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900" type="submit" disabled={!token}>作成</button>
          </form>
          {createdRecipeId ? <p className="mt-2 text-xs text-slate-300">作成済みID: {createdRecipeId}</p> : null}
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">2. 画像アップロード</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleUploadImage}>
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="recipeId" value={imageRecipeId} onChange={(e) => setImageRecipeId(e.target.value)} />
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="caption" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900" type="submit" disabled={!token}>アップロード</button>
          </form>
          <p className="mt-2 text-xs text-slate-400">最大5MBの画像ファイルに対応しています。</p>
        </article>
      </section>
    </main>
  );
}
