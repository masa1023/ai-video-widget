# 管理画面 仕様書

## 概要

`packages/admin` はウィジェットで再生する動画を管理するための Web アプリケーション。
プロジェクト管理者が動画のアップロード、スロット設定、分析データの閲覧を行う。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage（動画ファイル）

## ディレクトリ構成

```
packages/admin/
├── app/
│   ├── (auth)/                    # 認証関連（未認証でアクセス可）
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/               # 認証必須エリア
│   │   ├── layout.tsx             # サイドバー付きレイアウト
│   │   ├── page.tsx               # ダッシュボード（リダイレクト）
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx       # プロジェクト概要
│   │   │       ├── settings/page.tsx
│   │   │       ├── videos/page.tsx
│   │   │       ├── slots/page.tsx
│   │   │       ├── conversions/page.tsx
│   │   │       └── analytics/page.tsx
│   │   └── settings/page.tsx      # ユーザー設定
│   ├── api/
│   │   ├── widget/                # ウィジェット用 API（公開）
│   │   │   ├── config/[projectId]/route.ts
│   │   │   └── events/route.ts
│   │   └── internal/              # 管理画面用 API（認証必須）
│   │       └── ...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # 汎用 UI コンポーネント
│   └── features/                  # 機能別コンポーネント
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # ブラウザ用クライアント
│   │   ├── server.ts              # サーバー用クライアント
│   │   └── middleware.ts          # 認証ミドルウェア
│   └── utils/
└── types/
    └── database.ts                # Supabase 型定義
```

---

## 認証機能

### ページ

#### `/login` - ログイン

- **入力フィールド**: メールアドレス、パスワード
- **機能**:
  - Supabase Auth でログイン
  - 成功時: 所属プロジェクト一覧へリダイレクト
  - 失敗時: エラーメッセージ表示
- **リンク**: パスワードリセット、新規登録

#### `/signup` - 新規登録

- **入力フィールド**: メールアドレス、パスワード、表示名
- **機能**:
  - Supabase Auth でユーザー作成
  - 確認メール送信
  - `profiles` テーブルに自動レコード作成（トリガー）
- **備考**: 初期運用では Supabase ダッシュボードから招待

#### `/reset-password` - パスワードリセット

- **入力フィールド**: メールアドレス
- **機能**: リセットメール送信

### 認証ミドルウェア

`middleware.ts` で `(dashboard)` 配下へのアクセスを保護。

```typescript
// 認証チェック
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## プロジェクト管理

### ページ: `/projects/[projectId]`

プロジェクトのダッシュボード。主要指標のサマリーを表示。

#### 表示内容

- プロジェクト名、ドメイン
- 過去 30 日間のサマリー
  - ウィジェット展開数
  - 動画再生数
  - CV 数
- 埋め込みスクリプトタグ（コピー可能）

#### 埋め込みスクリプト生成

```html
<script
  src="https://[DOMAIN]/widget.js"
  data-project-id="[PROJECT_ID]"
></script>
```

### ページ: `/projects/[projectId]/settings`

プロジェクト設定の編集。

#### 入力フィールド

| フィールド | 型   | 説明                       |
| ---------- | ---- | -------------------------- |
| name       | TEXT | プロジェクト名（必須）     |
| domain     | TEXT | 対象ドメイン（オプション） |

#### 機能

- **保存**: `projects` テーブルを UPDATE
- **権限**: `admin` 以上

---

## 動画管理

### ページ: `/projects/[projectId]/videos`

動画一覧と管理。

#### 一覧表示

| カラム         | 説明                                       |
| -------------- | ------------------------------------------ |
| サムネイル     | 動画の最初のフレーム（または placeholder） |
| タイトル       | 動画タイトル                               |
| 長さ           | duration_seconds を MM:SS 形式で表示       |
| 使用スロット数 | この動画を使用している slots の数          |
| アクション     | 編集、削除                                 |

#### 動画アップロード

- **ファイル形式**: MP4, WebM
- **最大サイズ**: 100MB（設定可能）
- **処理フロー**:
  1. ファイル選択
  2. Supabase Storage にアップロード
  3. `videos` テーブルにレコード作成
  4. クライアントで動画メタデータ取得（duration_seconds）

#### 入力フィールド（新規作成/編集）

| フィールド       | 型    | 説明                                  |
| ---------------- | ----- | ------------------------------------- |
| title            | TEXT  | 動画タイトル（必須）                  |
| video_url        | TEXT  | Storage URL（アップロード後自動設定） |
| duration_seconds | FLOAT | 動画の長さ（自動取得）                |

---

## スロット管理

### ページ: `/projects/[projectId]/slots`

スロット（ナビゲーションノード）の一覧と編集。

#### 一覧表示

グラフビュー（推奨）またはリストビュー。

##### リストビュー カラム

| カラム             | 説明                         |
| ------------------ | ---------------------------- |
| スロットキー       | slot_key                     |
| タイトル           | 管理用タイトル               |
| 動画               | 紐づく video のタイトル      |
| エントリーポイント | is_entry_point（バッジ表示） |
| 遷移先             | slot_transitions の数        |
| アクション         | 編集、削除                   |

#### スロット編集フォーム

| フィールド         | 型      | 説明                               |
| ------------------ | ------- | ---------------------------------- |
| slot_key           | TEXT    | 一意のキー（必須、例: "node-1"）   |
| title              | TEXT    | 管理用タイトル                     |
| video_id           | UUID    | 紐づく動画（セレクトボックス）     |
| is_entry_point     | BOOLEAN | 開始ノードかどうか（1つのみ true） |
| detail_button_text | TEXT    | 詳細ボタンのラベル                 |
| detail_button_url  | TEXT    | 詳細ボタンのリンク先               |
| cta_button_text    | TEXT    | CTA ボタンのラベル                 |
| cta_button_url     | TEXT    | CTA ボタンのリンク先               |

#### 遷移設定（slot_transitions）

スロット編集画面内で設定。

| フィールド    | 型   | 説明                                  |
| ------------- | ---- | ------------------------------------- |
| to_slot_id    | UUID | 遷移先スロット（セレクトボックス）    |
| button_label  | TEXT | 遷移ボタンのラベル                    |
| display_order | INT  | 表示順（ドラッグ&ドロップで並び替え） |

**バリデーション**:

- `is_entry_point = true` のスロットは最低1つ必要
- 循環参照は許容（ユーザーが戻れる設計）

---

## コンバージョンルール管理

### ページ: `/projects/[projectId]/conversions`

CV 条件の定義と一覧。

#### 一覧表示

| カラム                 | 説明                         |
| ---------------------- | ---------------------------- |
| 名前                   | CV ルール名                  |
| タイプ                 | rule_type                    |
| パターン               | rule_value                   |
| アトリビューション期間 | attribution_days             |
| CV 数（30日）          | event_conversions のカウント |
| アクション             | 編集、削除                   |

#### 入力フィールド

| フィールド       | 型   | 説明                             | デフォルト  |
| ---------------- | ---- | -------------------------------- | ----------- |
| name             | TEXT | ルール名（必須、例: "予約完了"） | -           |
| rule_type        | TEXT | マッチタイプ                     | `url_match` |
| rule_value       | TEXT | マッチ対象 URL/パターン          | -           |
| attribution_days | INT  | アトリビューション期間（日）     | 30          |

#### rule_type の選択肢

| 値             | 説明     | 例                           |
| -------------- | -------- | ---------------------------- |
| `url_match`    | 完全一致 | `https://example.com/thanks` |
| `url_contains` | 部分一致 | `/thanks`                    |
| `url_regex`    | 正規表現 | `\/complete\?order_id=\d+`   |

---

## 分析ダッシュボード

### ページ: `/projects/[projectId]/analytics`

#### 期間フィルター

- 過去 7 日間
- 過去 30 日間（デフォルト）
- 過去 90 日間
- カスタム範囲

#### サマリーカード

| 指標               | 説明                                     | ソース                 |
| ------------------ | ---------------------------------------- | ---------------------- |
| ウィジェット展開数 | ウィジェットを開いたユニークセッション数 | event_widget_opens     |
| 動画再生数         | 総再生回数                               | event_video_starts     |
| 平均視聴完了率     | milestone=100 到達率                     | event_video_milestones |
| CV 数              | コンバージョン数                         | event_conversions      |
| CV 率              | CV数 / ウィジェット展開数                | 計算                   |

#### 動画別パフォーマンス

テーブル形式で表示。

| カラム       | 説明                          |
| ------------ | ----------------------------- |
| 動画タイトル | videos.title                  |
| 再生数       | event_video_starts のカウント |
| 25% 到達     | milestone=25 のカウント       |
| 50% 到達     | milestone=50 のカウント       |
| 75% 到達     | milestone=75 のカウント       |
| 完了         | milestone=100 のカウント      |
| 完了率       | 完了 / 再生数                 |

#### クリック分析

| カラム         | 説明                      |
| -------------- | ------------------------- |
| クリックタイプ | cta / detail / transition |
| ボタンラベル   | target_label              |
| クリック数     | event_clicks のカウント   |

---

## ウィジェット用 API

### `GET /api/widget/config/[projectId]`

ウィジェットが初期化時に呼び出す設定取得 API。

#### レスポンス

```typescript
interface WidgetConfig {
  projectId: string
  slots: {
    id: string
    slotKey: string
    videoUrl: string
    videoDuration: number
    isEntryPoint: boolean
    detailButton: { text: string; url: string } | null
    ctaButton: { text: string; url: string } | null
    transitions: {
      toSlotKey: string
      buttonLabel: string
      displayOrder: number
    }[]
  }[]
  conversionRules: {
    id: string
    ruleType: 'url_match' | 'url_contains' | 'url_regex'
    ruleValue: string
  }[]
}
```

#### 認証

不要（公開 API）。ただし `projectId` が存在しない場合は 404。

### `POST /api/widget/events`

イベント記録用 API。

#### リクエストボディ

```typescript
interface EventPayload {
  projectId: string
  sessionId: string // クライアント側で生成・Cookie 保存
  eventType:
    | 'widget_open'
    | 'video_start'
    | 'video_milestone'
    | 'click'
    | 'conversion'
  data: {
    // widget_open
    referrer?: string

    // video_start, video_milestone, click
    slotId?: string
    videoId?: string

    // video_milestone
    milestone?: 25 | 50 | 75 | 100
    playedSeconds?: number

    // click
    clickType?: 'cta' | 'detail' | 'transition'
    targetLabel?: string
    targetUrl?: string
    nextSlotId?: string

    // conversion
    conversionRuleId?: string
    matchedUrl?: string
    lastVideoStartId?: string
  }
}
```

#### 処理フロー

1. `sessionId` で `sessions` テーブルを検索
2. 存在しない場合は新規作成
3. `eventType` に応じたテーブルに INSERT
4. レスポンス: `{ success: true }`

#### 認証

service_role キーを使用（環境変数から取得）。
リクエスト元の Origin チェックは行わない（CORS 許可）。

---

## 権限モデル

| 操作                        | owner | admin | viewer |
| --------------------------- | ----- | ----- | ------ |
| プロジェクト削除            | o     | x     | x      |
| メンバー管理                | o     | x     | x      |
| プロジェクト設定編集        | o     | o     | x      |
| 動画/スロット/CV ルール編集 | o     | o     | x      |
| 分析データ閲覧              | o     | o     | o      |

---

## UI コンポーネント

### 必要なコンポーネント

| コンポーネント | 用途                                               |
| -------------- | -------------------------------------------------- |
| Button         | ボタン（variant: primary, secondary, destructive） |
| Input          | テキスト入力                                       |
| Select         | セレクトボックス                                   |
| Checkbox       | チェックボックス                                   |
| Table          | データテーブル                                     |
| Card           | カード                                             |
| Dialog         | モーダルダイアログ                                 |
| Toast          | 通知                                               |
| Sidebar        | サイドバーナビゲーション                           |
| FileUpload     | ファイルアップロード                               |
| CopyButton     | クリップボードコピー                               |

### 推奨

- shadcn/ui と Tailwind CSS を使用

---

## 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 実装優先順位

### Phase 1: 基盤

1. Supabase クライアント設定
2. 認証（ログイン/ログアウト）
3. 認証ミドルウェア
4. 基本レイアウト（サイドバー）

### Phase 2: コア機能

1. プロジェクト一覧・詳細
2. 動画アップロード・一覧
3. スロット CRUD
4. 遷移設定

### Phase 3: 分析・API

1. ウィジェット用 API（config, events）
2. 分析ダッシュボード
3. CV ルール管理

### Phase 4: 改善

1. グラフビュー（スロット遷移の可視化）
2. メンバー管理
3. ログ・監査機能
