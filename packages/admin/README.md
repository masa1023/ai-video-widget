# BonsAI Video — Admin Console

Next.js 16 + Supabase で構築された管理コンソール。プロジェクト・スロット・動画の管理とアナリティクスを提供する。

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth / DB / Storage**: Supabase
- **UI**: shadcn/ui + Tailwind CSS v4
- **Package Manager**: pnpm (monorepo)

## ローカル開発

### 前提

- Node.js 20+
- pnpm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- Docker (Supabase ローカル起動に必要)

### セットアップ

```bash
# リポジトリルートで依存関係をインストール
pnpm install

# Supabase をローカル起動
cd packages/admin
supabase start

# 環境変数を設定
cp .env.example .env.local
# .env.local に Supabase ローカルの URL とキーを設定
# (supabase start の出力に表示される)

# 開発サーバーを起動
pnpm dev
```

`http://localhost:3000` でアクセス可能。

### 環境変数

| 変数名                                 | 説明                                      | 必須 |
| -------------------------------------- | ----------------------------------------- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase プロジェクト URL                 | Yes  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key           | Yes  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase service role key (Widget API 用) | Yes  |

## Vercel デプロイ

### 初回セットアップ

1. Vercel で新規プロジェクトを作成し、このリポジトリを接続
2. **Root Directory** を `packages/admin` に設定
3. Framework Preset は **Next.js** を選択（自動検出される）
4. Environment Variables に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

### ビルド設定

`vercel.json` で `installCommand` をカスタムしており、モノレポルートから `pnpm install` を実行する。ビルドコマンド (`next build`) とアウトプットディレクトリはデフォルトのまま。

## Supabase デプロイ

### 初回セットアップ

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクトを作成
2. Supabase CLI をリモートプロジェクトにリンク:

```bash
cd packages/admin
supabase link --project-ref <project-ref>
```

3. マイグレーションを適用:

```bash
supabase db push
```

4. ストレージバケット (`videos`, `images`) はマイグレーションで自動作成される

### マイグレーションの追加

```bash
cd packages/admin

# 新しいマイグレーションを作成
supabase migration new <migration_name>

# ローカルでテスト
supabase db reset

# リモートに適用
supabase db push
```

## プロジェクト構成

```
packages/admin/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # 認証必須の管理画面
│   ├── api/widget/         # Widget 向け公開 API
│   ├── auth/               # 認証コールバック
│   ├── login/              # ログインページ
│   └── signup/             # サインアップページ
├── components/             # UI コンポーネント
├── lib/supabase/           # Supabase クライアント設定
├── supabase/
│   ├── config.toml         # Supabase CLI ローカル設定
│   └── migrations/         # DB マイグレーション
└── vercel.json             # Vercel デプロイ設定
```
