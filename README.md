# Baby Bites Platform

子育て世代向けに、離乳食レシピ・コミュニティ・外部情報連携を提供するフルスタックプロジェクトです。  
本実装では、認証（Google/LINE + 開発用ログイン）、ユーザー管理、画像アップロード、通報/モデレーションまで含めて初期構築しています。

## 技術スタック

- Web: Next.js (App Router) + TypeScript + Tailwind
- API: NestJS + Prisma + Swagger
- DB: PostgreSQL
- Cache: Redis
- Local Infra: Docker Compose

## ディレクトリ構成

- `apps/web` : フロントエンド
- `apps/api` : バックエンドAPI
- `docs/architecture.md` : 技術設計・ER図・API設計
- `uploads/` : アップロード画像（ローカル）

## セットアップ

1. 依存関係インストール

```bash
npm install
```

2. 環境変数ファイル作成

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

3. DB/Redis起動

```bash
docker compose up -d
```

4. Prisma生成・スキーマ反映・初期データ投入

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

5. 開発起動（別ターミナル2つ）

```bash
npm run dev:api
npm run dev:web
```

## エンドポイント

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`

## Webページ

- `/` : ホーム
- `/recipes` : レシピ一覧
- `/community` : コミュニティ一覧
- `/resources` : 外部情報連携
- `/account` : ログイン・プロフィール管理
- `/studio` : レシピ投稿・画像アップロード
- `/moderation` : 通報作成・モデレーション対応

## 主要API

- Health
  - `GET /health`
- Auth / Users
  - `GET /auth/google/url`
  - `GET /auth/line/url`
  - `POST /auth/dev-login`
  - `POST /auth/oauth-login`
  - `GET /auth/me`
  - `POST /auth/logout`
  - `GET /users/me`
  - `PATCH /users/me`
- Recipes
  - `GET /recipes`
  - `GET /recipes/:id`
  - `POST /recipes` (ログイン必須)
  - `POST /recipes/:id/images` (ログイン必須, multipart)
- Community
  - `GET /community/topics`
  - `GET /community/posts`
  - `POST /community/posts` (ログイン必須)
  - `POST /community/posts/:postId/comments` (ログイン必須)
- Moderation
  - `POST /moderation/reports` (ログイン必須)
  - `GET /moderation/reports` (MODERATOR/ADMIN)
  - `PATCH /moderation/reports/:id` (MODERATOR/ADMIN)
  - `GET /moderation/dashboard` (MODERATOR/ADMIN)
- Resources
  - `GET /resources/nearby`
  - `GET /resources/news`

## 開発用ログイン例

- 一般ユーザー: `providerUserId=demo-user`
- モデレーター: `providerUserId=moderator-user`
- 管理者: `providerUserId=admin-user`

`/account` ページの「開発用ログイン」からそのまま利用できます。
