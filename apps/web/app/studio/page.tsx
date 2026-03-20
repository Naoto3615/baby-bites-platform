'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  createRecipe,
  getMyCommunityPosts,
  getMyRecipes,
  updateMyCommunityPost,
  updateMyRecipe,
  uploadRecipeImage,
} from '../lib/client-api';
import { getStoredAccessToken } from '../lib/auth-client';
import { CommunityPost, FeedingStage, Recipe } from '../lib/types';

const stages: FeedingStage[] = [
  'STAGE_5_6',
  'STAGE_7_8',
  'STAGE_9_11',
  'STAGE_12_18',
];

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitByComma(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
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
  const [stepsText, setStepsText] = useState(
    'やわらかく茹でる\nなめらかになるまでつぶす\n濃度を調整する',
  );

  const [createdRecipeId, setCreatedRecipeId] = useState('');
  const [imageRecipeId, setImageRecipeId] = useState('');
  const [imageCaption, setImageCaption] = useState('完成イメージ');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [editRecipeTitle, setEditRecipeTitle] = useState('');
  const [editRecipeDescription, setEditRecipeDescription] = useState('');
  const [editRecipeStage, setEditRecipeStage] = useState<FeedingStage>('STAGE_5_6');
  const [editRecipePrepMinutes, setEditRecipePrepMinutes] = useState(0);
  const [editRecipeCookMinutes, setEditRecipeCookMinutes] = useState(0);
  const [editRecipeServings, setEditRecipeServings] = useState(1);
  const [editRecipeAllergens, setEditRecipeAllergens] = useState('');
  const [editRecipeTags, setEditRecipeTags] = useState('');
  const [editRecipeCoverImageUrl, setEditRecipeCoverImageUrl] = useState('');

  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostBody, setEditPostBody] = useState('');
  const [editPostStage, setEditPostStage] = useState<FeedingStage | ''>('');

  const selectedRecipe = useMemo(
    () => myRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [myRecipes, selectedRecipeId],
  );

  const selectedPost = useMemo(
    () => myPosts.find((post) => post.id === selectedPostId) ?? null,
    [myPosts, selectedPostId],
  );

  const applyRecipeToEditFields = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setEditRecipeTitle(recipe.title);
    setEditRecipeDescription(recipe.description);
    setEditRecipeStage(recipe.stage);
    setEditRecipePrepMinutes(recipe.prepMinutes);
    setEditRecipeCookMinutes(recipe.cookMinutes);
    setEditRecipeServings(recipe.servings);
    setEditRecipeAllergens((recipe.allergens ?? []).join(', '));
    setEditRecipeTags((recipe.tags ?? []).map((tag) => tag.value).join(', '));
    setEditRecipeCoverImageUrl(recipe.coverImageUrl ?? '');
  };

  const applyPostToEditFields = (post: CommunityPost) => {
    setSelectedPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostBody(post.body);
    setEditPostStage(post.stage ?? '');
  };

  const loadMyRecipes = async () => {
    if (!token) {
      setMessage('先にAccountページでログインしてください');
      return;
    }

    try {
      const result = await getMyRecipes(token);
      setMyRecipes(result.items);

      if (result.items.length === 0) {
        setSelectedRecipeId('');
        setMessage('編集可能な自分のレシピがまだありません');
        return;
      }

      const target =
        result.items.find((recipe) => recipe.id === selectedRecipeId) ??
        result.items[0];
      applyRecipeToEditFields(target);
      setMessage(`自分のレシピを読み込みました（${result.items.length}件）`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '自分のレシピ取得に失敗しました',
      );
    }
  };

  const loadMyPosts = async () => {
    if (!token) {
      setMessage('先にAccountページでログインしてください');
      return;
    }

    try {
      const result = await getMyCommunityPosts(token);
      setMyPosts(result.items);

      if (result.items.length === 0) {
        setSelectedPostId('');
        setMessage('編集可能な自分の相談投稿がまだありません');
        return;
      }

      const target =
        result.items.find((post) => post.id === selectedPostId) ?? result.items[0];
      applyPostToEditFields(target);
      setMessage(`自分の相談投稿を読み込みました（${result.items.length}件）`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '自分の相談投稿取得に失敗しました',
      );
    }
  };

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
        allergens: splitByComma(allergens),
        tags: splitByComma(tags),
        ingredients: ingredientRows,
        steps: stepRows,
      });

      setCreatedRecipeId(created.id);
      setImageRecipeId(created.id);
      setMessage(`レシピ作成完了: ${created.id}`);
      await loadMyRecipes();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'レシピ作成に失敗しました',
      );
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
      const uploaded = await uploadRecipeImage(
        token,
        imageRecipeId,
        imageFile,
        imageCaption || undefined,
      );
      setMessage(`画像アップロード完了: ${uploaded.url}`);
      await loadMyRecipes();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '画像アップロードに失敗しました',
      );
    }
  };

  const handleUpdateRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage('先にログインしてください');
      return;
    }

    if (!selectedRecipe) {
      setMessage('編集対象のレシピを選択してください');
      return;
    }

    try {
      await updateMyRecipe(token, selectedRecipe.id, {
        title: editRecipeTitle,
        description: editRecipeDescription,
        stage: editRecipeStage,
        prepMinutes: editRecipePrepMinutes,
        cookMinutes: editRecipeCookMinutes,
        servings: editRecipeServings,
        allergens: splitByComma(editRecipeAllergens),
        tags: splitByComma(editRecipeTags),
        coverImageUrl: editRecipeCoverImageUrl || undefined,
      });
      setMessage(`レシピを更新しました: ${selectedRecipe.title}`);
      await loadMyRecipes();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'レシピ更新に失敗しました',
      );
    }
  };

  const handleUpdatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage('先にログインしてください');
      return;
    }

    if (!selectedPost) {
      setMessage('編集対象の相談投稿を選択してください');
      return;
    }

    try {
      await updateMyCommunityPost(token, selectedPost.id, {
        title: editPostTitle,
        body: editPostBody,
        stage: editPostStage === '' ? undefined : editPostStage,
      });
      setMessage(`相談投稿を更新しました: ${selectedPost.title}`);
      await loadMyPosts();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '相談投稿更新に失敗しました',
      );
    }
  };

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">RECIPE STUDIO</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">
          わが家のレシピをシェア
        </h1>
        <p className="muted mt-3 text-sm md:text-base">
          つくりやすかった離乳食を投稿して、同じ月齢のご家庭と共有できます。
        </p>
        {message ? <p className="notice mt-4 text-sm">{message}</p> : null}
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">1. レシピ作成</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleCreateRecipe}>
            <input className="field px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
            <textarea className="field min-h-20 px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明" />
            <select className="field px-3 py-2 text-sm" value={stage} onChange={(e) => setStage(e.target.value as FeedingStage)}>
              {stages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input className="field px-3 py-2 text-sm" type="number" min={0} value={prepMinutes} onChange={(e) => setPrepMinutes(Number(e.target.value))} placeholder="準備" />
              <input className="field px-3 py-2 text-sm" type="number" min={0} value={cookMinutes} onChange={(e) => setCookMinutes(Number(e.target.value))} placeholder="調理" />
              <input className="field px-3 py-2 text-sm" type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} placeholder="食分" />
            </div>
            <input className="field px-3 py-2 text-sm" value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="アレルゲン (カンマ区切り)" />
            <input className="field px-3 py-2 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ (カンマ区切り)" />
            <textarea className="field min-h-24 px-3 py-2 text-sm" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder="材料: 1行1件 (name|amount|note)" />
            <textarea className="field min-h-24 px-3 py-2 text-sm" value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder="手順: 1行1件" />
            <button className="btn-main px-4 py-2 text-sm" type="submit" disabled={!token}>作成</button>
          </form>
          {createdRecipeId ? <p className="mt-2 text-xs text-slate-300">作成済みID: {createdRecipeId}</p> : null}
        </article>

        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">2. 画像アップロード</h2>
          <form className="mt-3 grid gap-2" onSubmit={handleUploadImage}>
            <input className="field px-3 py-2 text-sm" placeholder="recipeId" value={imageRecipeId} onChange={(e) => setImageRecipeId(e.target.value)} />
            <input className="field px-3 py-2 text-sm" placeholder="caption" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
            <input className="field px-3 py-2 text-sm" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            <button className="btn-main px-4 py-2 text-sm" type="submit" disabled={!token}>アップロード</button>
          </form>
          <p className="mt-2 text-xs text-slate-400">最大5MBの画像ファイルに対応しています。</p>
        </article>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">3. 自分のレシピを編集</h2>
            <button className="btn-sub px-3 py-1.5 text-xs" type="button" onClick={() => void loadMyRecipes()} disabled={!token}>
              読み込む
            </button>
          </div>

          <form className="mt-3 grid gap-2" onSubmit={handleUpdateRecipe}>
            <select
              className="field px-3 py-2 text-sm"
              value={selectedRecipeId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedRecipeId(id);
                const recipe = myRecipes.find((item) => item.id === id);
                if (recipe) {
                  applyRecipeToEditFields(recipe);
                }
              }}
            >
              <option value="">編集するレシピを選択</option>
              {myRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
              ))}
            </select>
            <input className="field px-3 py-2 text-sm" placeholder="タイトル" value={editRecipeTitle} onChange={(e) => setEditRecipeTitle(e.target.value)} />
            <textarea className="field min-h-20 px-3 py-2 text-sm" placeholder="説明" value={editRecipeDescription} onChange={(e) => setEditRecipeDescription(e.target.value)} />
            <select className="field px-3 py-2 text-sm" value={editRecipeStage} onChange={(e) => setEditRecipeStage(e.target.value as FeedingStage)}>
              {stages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input className="field px-3 py-2 text-sm" type="number" min={0} value={editRecipePrepMinutes} onChange={(e) => setEditRecipePrepMinutes(Number(e.target.value))} />
              <input className="field px-3 py-2 text-sm" type="number" min={0} value={editRecipeCookMinutes} onChange={(e) => setEditRecipeCookMinutes(Number(e.target.value))} />
              <input className="field px-3 py-2 text-sm" type="number" min={1} value={editRecipeServings} onChange={(e) => setEditRecipeServings(Number(e.target.value))} />
            </div>
            <input className="field px-3 py-2 text-sm" placeholder="アレルゲン (カンマ区切り)" value={editRecipeAllergens} onChange={(e) => setEditRecipeAllergens(e.target.value)} />
            <input className="field px-3 py-2 text-sm" placeholder="タグ (カンマ区切り)" value={editRecipeTags} onChange={(e) => setEditRecipeTags(e.target.value)} />
            <input className="field px-3 py-2 text-sm" placeholder="カバー画像URL" value={editRecipeCoverImageUrl} onChange={(e) => setEditRecipeCoverImageUrl(e.target.value)} />
            <button className="btn-main px-4 py-2 text-sm" type="submit" disabled={!token || !selectedRecipeId}>レシピを更新</button>
          </form>
        </article>

        <article className="surface rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">4. 自分の相談投稿を編集</h2>
            <button className="btn-sub px-3 py-1.5 text-xs" type="button" onClick={() => void loadMyPosts()} disabled={!token}>
              読み込む
            </button>
          </div>

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
                <option key={post.id} value={post.id}>{post.title}</option>
              ))}
            </select>
            <input className="field px-3 py-2 text-sm" placeholder="タイトル" value={editPostTitle} onChange={(e) => setEditPostTitle(e.target.value)} />
            <textarea className="field min-h-24 px-3 py-2 text-sm" placeholder="本文" value={editPostBody} onChange={(e) => setEditPostBody(e.target.value)} />
            <select className="field px-3 py-2 text-sm" value={editPostStage} onChange={(e) => setEditPostStage(e.target.value as FeedingStage | '')}>
              <option value="">月齢未設定</option>
              {stages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <button className="btn-main px-4 py-2 text-sm" type="submit" disabled={!token || !selectedPostId}>相談投稿を更新</button>
          </form>
        </article>
      </section>
    </main>
  );
}
