# DB Schema - AI Video Widget

## 概要

マルチテナント対応のイベントトラッキングシステム用データベース設計。

### 設計方針

- **マルチテナント**: `organizations` → `projects` の階層でテナント分離
- **認証**: Supabase Auth (`auth.users`) + `profiles` テーブル
- **組織構造**: 1ユーザー = 1組織に所属（シンプル）、1組織 = 複数プロジェクト
- **セッション**: 540日有効（長期ユーザー識別）
- **スロット**: navigation-graph のノードと同義（動画 + ボタン設定 + 分岐先）
- **動画再生ログ**: 離脱・視聴完了時に再生時間を記録 (`event_video_views`)
- **CV検知**: ウィジェットがページ遷移を監視し、`conversion_rules` と照合
- **字幕**: 静的ファイル管理（DB対象外）

## ER図（概念）

```
auth.users (Supabase Auth)
└── profiles (ユーザープロフィール + 組織所属)
    └── organizations (企業/組織)
        └── projects (プロジェクト/サイト)
            ├── videos (動画マスタ)
            ├── slots (スロット = ナビゲーションノード)
            │   └── slot_transitions (スロット間遷移)
            ├── conversion_rules (CV条件)
            └── sessions (セッション)
                ├── event_widget_opens (ウィジェット展開)
                ├── event_video_starts (動画再生開始)
                ├── event_video_views (視聴ログ: 離脱/完了時)
                ├── event_clicks (ボタンクリック)
                └── event_conversions (CV達成)
```

---

## テーブル定義

### organizations

企業/組織。マルチテナントの最上位単位。

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- IDは手動指定
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive', -- 'active' or 'inactive'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### profiles

ユーザープロフィール。`auth.users` と 1:1 で紐づく。

```sql
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'viewer');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role member_role NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_email ON profiles(email);
```

### projects

プロジェクト（組織配下）。1サイト = 1プロジェクト。

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    allowed_origins TEXT[],  -- ウィジェット埋め込み許可オリジン
    thumbnail_url TEXT,       -- サムネイル画像（縮小サークル表示用）のストレージパス
    background_url TEXT,      -- 背景画像（展開時の動画背景）のストレージパス
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_allowed_origins ON projects(allowed_origins);
```

### videos

動画マスタ。ボタン設定は `slots` テーブルで管理。

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration_seconds FLOAT,  -- 動画の長さ（秒）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_project_id ON videos(project_id);
```

### slots

スロット = navigation-graph のノード。動画とボタン設定、分岐先を持つ。

```sql
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title TEXT,  -- 管理用タイトル
    is_entry_point BOOLEAN NOT NULL DEFAULT FALSE,  -- 開始ノードかどうか
    -- ボタン設定
    detail_button_text TEXT,
    detail_button_url TEXT,
    cta_button_text TEXT,
    cta_button_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slots_project_id ON slots(project_id);
CREATE INDEX idx_slots_video_id ON slots(video_id);
```

### slot_transitions

スロット間の遷移定義（navigation-graph の `nextNodeIds` に相当）。

```sql
CREATE TABLE slot_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    to_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,  -- 表示順
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_slot_id, to_slot_id)
);

CREATE INDEX idx_slot_transitions_from_slot_id ON slot_transitions(from_slot_id);
```

### conversion_rules

CV（コンバージョン）条件の定義。

```sql
CREATE TABLE conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- 例: "予約完了", "お問い合わせ送信"
    rule_type TEXT NOT NULL DEFAULT 'url_match',  -- 'url_match', 'url_contains', 'url_regex'
    rule_value TEXT NOT NULL,  -- マッチ対象のURL/パターン
    attribution_days INT NOT NULL DEFAULT 30,  -- アトリビューション期間（日）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversion_rules_project_id ON conversion_rules(project_id);
```

### sessions

セッション。540日間有効。ユーザーを一意に識別。

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- 有効期限は created_at + 540日で計算
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

---

## イベントテーブル

### event_widget_opens

ウィジェット展開イベント（クリックして開いた時）。

```sql
CREATE TABLE event_widget_opens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    referrer TEXT,  -- ウィジェットを開いたページのURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_widget_opens_project_id ON event_widget_opens(project_id);
CREATE INDEX idx_event_widget_opens_session_id ON event_widget_opens(session_id);
CREATE INDEX idx_event_widget_opens_created_at ON event_widget_opens(created_at);
```

### event_video_starts

動画再生開始イベント。

```sql
CREATE TABLE event_video_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_video_starts_project_id ON event_video_starts(project_id);
CREATE INDEX idx_event_video_starts_session_id ON event_video_starts(session_id);
CREATE INDEX idx_event_video_starts_video_id ON event_video_starts(video_id);
CREATE INDEX idx_event_video_starts_slot_id ON event_video_starts(slot_id);
CREATE INDEX idx_event_video_starts_created_at ON event_video_starts(created_at);
```

### event_video_views

動画視聴ログ。離脱時および再生完了時に記録。

```sql
CREATE TABLE event_video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    played_seconds FLOAT NOT NULL,  -- 再生時間（秒）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_video_views_project_id ON event_video_views(project_id);
CREATE INDEX idx_event_video_views_session_id ON event_video_views(session_id);
CREATE INDEX idx_event_video_views_video_id ON event_video_views(video_id);
CREATE INDEX idx_event_video_views_slot_id ON event_video_views(slot_id);
CREATE INDEX idx_event_video_views_created_at ON event_video_views(created_at);
```

### event_clicks

ボタンクリックイベント（CTA、詳細ボタン、分岐ボタン）。

```sql
CREATE TABLE event_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    click_type TEXT NOT NULL,  -- 'cta', 'detail', 'transition'
    target_label TEXT,  -- ボタンのラベル
    target_url TEXT,  -- クリック先URL（CTAや詳細ボタンの場合）
    next_slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,  -- 遷移先スロット（transitionの場合）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_clicks_project_id ON event_clicks(project_id);
CREATE INDEX idx_event_clicks_session_id ON event_clicks(session_id);
CREATE INDEX idx_event_clicks_slot_id ON event_clicks(slot_id);
CREATE INDEX idx_event_clicks_click_type ON event_clicks(click_type);
CREATE INDEX idx_event_clicks_created_at ON event_clicks(created_at);
```

### event_conversions

CV達成イベント。

```sql
CREATE TABLE event_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    conversion_rule_id UUID NOT NULL REFERENCES conversion_rules(id) ON DELETE CASCADE,
    matched_url TEXT,  -- CV条件にマッチしたURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_conversions_project_id ON event_conversions(project_id);
CREATE INDEX idx_event_conversions_session_id ON event_conversions(session_id);
CREATE INDEX idx_event_conversions_conversion_rule_id ON event_conversions(conversion_rule_id);
CREATE INDEX idx_event_conversions_created_at ON event_conversions(created_at);
```

---

## RLS ポリシー

### ヘルパー関数

```sql
-- ユーザーの組織IDを取得
CREATE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- プロジェクトが自分の組織に属するか確認
CREATE FUNCTION is_my_organization_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_id
        AND p.organization_id = get_user_organization_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### ポリシー定義

```sql
-- profiles: 自分のレコードのみ参照可能
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- organizations: 自分の組織のみ参照可能
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

-- projects: 自分の組織のプロジェクトのみ
CREATE POLICY "Users can access own org projects" ON projects
    FOR ALL USING (organization_id = get_user_organization_id());

-- videos: プロジェクト経由で確認
CREATE POLICY "Users can access own org videos" ON videos
    FOR ALL USING (is_my_organization_project(project_id));

-- slots: プロジェクト経由で確認
CREATE POLICY "Users can access own org slots" ON slots
    FOR ALL USING (is_my_organization_project(project_id));

-- slot_transitions: スロット経由で確認
CREATE POLICY "Users can access own org slot_transitions" ON slot_transitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- conversion_rules: プロジェクト経由で確認
CREATE POLICY "Users can access own org conversion_rules" ON conversion_rules
    FOR ALL USING (is_my_organization_project(project_id));

-- sessions: プロジェクト経由で確認
CREATE POLICY "Users can access own org sessions" ON sessions
    FOR ALL USING (is_my_organization_project(project_id));

-- event_*: セッション経由で確認
CREATE POLICY "Users can access own org event_widget_opens" ON event_widget_opens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- （他のイベントテーブルも同様）
```

### Service Role ポリシー

```sql
-- 各テーブルに service_role 用のフルアクセスポリシーを設定
CREATE POLICY "Service role full access" ON [table_name]
    FOR ALL USING (auth.role() = 'service_role');
```

---

## 備考

- **ストレージ**: `videos` バケット（動画ファイル）と `images` バケット（サムネイル・背景画像）。いずれも public アクセス。パス形式: `{organization_id}/{project_id}/{filename}`
- **字幕**: 静的ファイル（VTT等）で管理。DBには保存しない。
- **セッション有効期限**: アプリケーションレベルで `created_at + 540日` で判定。
- **CV検知**: ウィジェットがページ遷移を監視し、`conversion_rules` の条件と照合してイベント送信。
- **role**: 当面は `owner` のみ使用。将来的に `admin`, `viewer` を活用予定。
