# DB Schema - AI Video Widget

## 概要

マルチテナント対応のイベントトラッキングシステム用データベース設計。

### 設計方針

- **マルチテナント**: `organizations` → `projects` の階層でテナント分離
- **認証**: Supabase Auth (`auth.users`) + `profiles` テーブル
- **組織構造**: 1ユーザー = 1組織に所属（シンプル）、1組織 = 複数プロジェクト
- **セッション**: 540日有効（長期ユーザー識別）
- **スロット**: navigation-graph のノードと同義（動画 + ボタン設定 + 分岐先）
- **進捗記録**: マイルストーン毎に1レコード（25%, 50%, 75%, 100%）
- **字幕**: 静的ファイル管理（DB対象外）
- **CV検知**: ウィジェットがページ遷移を監視し、`conversion_rules` と照合

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
                ├── event_video_milestones (再生進捗 25/50/75/100%)
                ├── event_clicks (ボタンクリック)
                └── event_conversions (CV達成)
```

---

## テーブル定義

### organizations

企業/組織。マルチテナントの最上位単位。

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
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
    domain TEXT,  -- 例: "example.com"（オプション）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_domain ON projects(domain);
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
    slot_key TEXT NOT NULL,  -- 例: "node-1", "opening"
    title TEXT,  -- 管理用タイトル
    is_entry_point BOOLEAN NOT NULL DEFAULT FALSE,  -- 開始ノードかどうか
    -- ボタン設定
    detail_button_text TEXT,
    detail_button_url TEXT,
    cta_button_text TEXT,
    cta_button_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, slot_key)
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
    button_label TEXT NOT NULL,  -- 遷移ボタンのラベル
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
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    referrer TEXT,  -- ウィジェットを開いたページのURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_widget_opens_session_id ON event_widget_opens(session_id);
CREATE INDEX idx_event_widget_opens_created_at ON event_widget_opens(created_at);
```

### event_video_starts

動画再生開始イベント。

```sql
CREATE TABLE event_video_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_video_starts_session_id ON event_video_starts(session_id);
CREATE INDEX idx_event_video_starts_video_id ON event_video_starts(video_id);
CREATE INDEX idx_event_video_starts_slot_id ON event_video_starts(slot_id);
CREATE INDEX idx_event_video_starts_created_at ON event_video_starts(created_at);
```

### event_video_milestones

動画再生進捗イベント。25%, 50%, 75%, 100% 到達時に記録。

```sql
CREATE TABLE event_video_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    milestone INT NOT NULL,  -- 25, 50, 75, 100
    played_seconds FLOAT,  -- 到達時点までの実再生時間（秒）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_milestone CHECK (milestone IN (25, 50, 75, 100))
);

CREATE INDEX idx_event_video_milestones_session_id ON event_video_milestones(session_id);
CREATE INDEX idx_event_video_milestones_video_id ON event_video_milestones(video_id);
CREATE INDEX idx_event_video_milestones_slot_id ON event_video_milestones(slot_id);
CREATE INDEX idx_event_video_milestones_created_at ON event_video_milestones(created_at);
```

### event_clicks

ボタンクリックイベント（CTA、詳細ボタン、分岐ボタン）。

```sql
CREATE TABLE event_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    click_type TEXT NOT NULL,  -- 'cta', 'detail', 'transition'
    target_label TEXT,  -- ボタンのラベル
    target_url TEXT,  -- クリック先URL（CTAや詳細ボタンの場合）
    next_slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,  -- 遷移先スロット（transitionの場合）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    conversion_rule_id UUID NOT NULL REFERENCES conversion_rules(id) ON DELETE CASCADE,
    last_video_start_id UUID REFERENCES event_video_starts(id) ON DELETE SET NULL,  -- 直近の動画再生
    matched_url TEXT,  -- CV条件にマッチしたURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

## トリガー

### ユーザー作成時の profiles 自動作成

```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**注意**: このトリガーでは `organization_id` を設定していません。初期運用では:
1. 運営側が Supabase Dashboard で organization を作成
2. ユーザー招待時に organization_id を手動で設定

---

## ウィジェット実装との対応

### video-config → videos + slots

現在の `videoConfig`:

```javascript
{
  id: 1,
  title: 'オープニング',
  videoUrl: '...',
  detailButton: { text: '詳細はこちら', link: '...' },
  ctaButton: { text: '予約する', link: '...' },
  subtitles: [...]
}
```

→ `videos` テーブル + `slots` テーブルに分離:

- `videos`: id, title, video_url, duration_seconds
- `slots`: video_id, detail_button_text, detail_button_url, cta_button_text, cta_button_url

### navigation-graph → slots + slot_transitions

現在の `navigationGraph`:

```javascript
{
  'node-1': {
    videoId: 1,
    nextNodeIds: ['node-2', 'node-3', 'node-4'],
  },
  ...
}
```

→ `slots` + `slot_transitions` テーブルに対応:

- `slots.slot_key` = 'node-1'
- `slots.video_id` = videos.id（videoId: 1 に対応）
- `slot_transitions` = nextNodeIds の各要素に対応

---

## 集計クエリ例

### UU（ユニークセッション）数

```sql
SELECT COUNT(DISTINCT session_id)
FROM event_widget_opens
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### 動画再生数（動画ID別）

```sql
SELECT v.title, COUNT(*) as play_count
FROM event_video_starts evs
JOIN videos v ON evs.video_id = v.id
WHERE evs.created_at >= NOW() - INTERVAL '30 days'
GROUP BY v.id, v.title
ORDER BY play_count DESC;
```

### 再生完了率（動画ID別）

```sql
SELECT
    v.title,
    COUNT(DISTINCT evs.session_id) as started,
    COUNT(DISTINCT CASE WHEN evm.milestone = 100 THEN evm.session_id END) as completed,
    ROUND(
        COUNT(DISTINCT CASE WHEN evm.milestone = 100 THEN evm.session_id END)::NUMERIC
        / NULLIF(COUNT(DISTINCT evs.session_id), 0) * 100,
        2
    ) as completion_rate
FROM event_video_starts evs
JOIN videos v ON evs.video_id = v.id
LEFT JOIN event_video_milestones evm ON evs.video_id = evm.video_id AND evs.session_id = evm.session_id
WHERE evs.created_at >= NOW() - INTERVAL '30 days'
GROUP BY v.id, v.title;
```

### CV数とCV率

```sql
WITH widget_users AS (
    SELECT DISTINCT session_id
    FROM event_widget_opens
    WHERE created_at >= NOW() - INTERVAL '30 days'
),
conversions AS (
    SELECT DISTINCT session_id
    FROM event_conversions
    WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT
    (SELECT COUNT(*) FROM widget_users) as total_users,
    (SELECT COUNT(*) FROM conversions WHERE session_id IN (SELECT session_id FROM widget_users)) as converted_users,
    ROUND(
        (SELECT COUNT(*) FROM conversions WHERE session_id IN (SELECT session_id FROM widget_users))::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM widget_users), 0) * 100,
        2
    ) as conversion_rate;
```

---

## 備考

- **字幕**: 静的ファイル（VTT等）で管理。DBには保存しない。
- **セッション有効期限**: アプリケーションレベルで `created_at + 540日` で判定。
- **CV検知**: ウィジェットがページ遷移を監視し、`conversion_rules` の条件と照合してイベント送信。
- **role**: 当面は `owner` のみ使用。将来的に `admin`, `viewer` を活用予定。
