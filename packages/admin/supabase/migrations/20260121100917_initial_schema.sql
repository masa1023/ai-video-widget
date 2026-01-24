-- AI Video Widget - Initial Schema Migration
-- This migration creates all tables, indexes, RLS policies, and triggers

-- =============================================================================
-- 1. organizations - 企業/組織（マルチテナント最上位単位）
-- =============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. profiles - ユーザープロフィール（auth.users と 1:1）
-- =============================================================================
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

-- =============================================================================
-- 3. projects - プロジェクト（組織配下、1サイト = 1プロジェクト）
-- =============================================================================
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

-- =============================================================================
-- 4. videos - 動画マスタ
-- =============================================================================
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

-- =============================================================================
-- 5. slots - スロット = ナビゲーションノード
-- =============================================================================
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

-- =============================================================================
-- 6. slot_transitions - スロット間遷移
-- =============================================================================
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

-- =============================================================================
-- 7. conversion_rules - CV条件定義
-- =============================================================================
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

-- =============================================================================
-- 8. sessions - セッション
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- 有効期限は created_at + 540日で計算
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- =============================================================================
-- 9. event_widget_opens - ウィジェット展開イベント
-- =============================================================================
CREATE TABLE event_widget_opens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    referrer TEXT,  -- ウィジェットを開いたページのURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_widget_opens_session_id ON event_widget_opens(session_id);
CREATE INDEX idx_event_widget_opens_created_at ON event_widget_opens(created_at);

-- =============================================================================
-- 10. event_video_starts - 動画再生開始イベント
-- =============================================================================
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

-- =============================================================================
-- 11. event_video_views - 動画視聴イベント
-- =============================================================================
CREATE TABLE event_video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    played_seconds FLOAT NOT NULL, -- Actual played duration in seconds
    duration_seconds FLOAT NOT NULL, -- Total duration of the video
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_event_video_views_session_id ON event_video_views(session_id);
CREATE INDEX idx_event_video_views_video_id ON event_video_views(video_id);
CREATE INDEX idx_event_video_views_slot_id ON event_video_views(slot_id);
CREATE INDEX idx_event_video_views_created_at ON event_video_views(created_at);

-- =============================================================================
-- 12. event_clicks - ボタンクリックイベント
-- =============================================================================
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

-- =============================================================================
-- 13. event_conversions - CV達成イベント
-- =============================================================================
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

-- =============================================================================
-- RLS Helper Functions
-- =============================================================================

-- ユーザーの組織IDを取得
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- プロジェクトが自分の組織に属するか確認
CREATE OR REPLACE FUNCTION is_my_organization_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = p_project_id
        AND p.organization_id = get_user_organization_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_widget_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_video_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_conversions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Service Role Full Access Policies
-- =============================================================================
CREATE POLICY "Service role full access" ON organizations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON projects
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON videos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON slots
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON slot_transitions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON conversion_rules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_widget_opens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_video_starts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_video_views
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_clicks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_conversions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- User Access Policies
-- =============================================================================

-- profiles: 自分のレコードのみ参照・更新可能
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- organizations: 自分の組織のみ参照可能
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

-- projects: 自分の組織のプロジェクトのみアクセス可能
CREATE POLICY "Users can select own org projects" ON projects
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own org projects" ON projects
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own org projects" ON projects
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own org projects" ON projects
    FOR DELETE USING (organization_id = get_user_organization_id());

-- videos: プロジェクト経由で確認
CREATE POLICY "Users can select own org videos" ON videos
    FOR SELECT USING (is_my_organization_project(project_id));

CREATE POLICY "Users can insert own org videos" ON videos
    FOR INSERT WITH CHECK (is_my_organization_project(project_id));

CREATE POLICY "Users can update own org videos" ON videos
    FOR UPDATE USING (is_my_organization_project(project_id));

CREATE POLICY "Users can delete own org videos" ON videos
    FOR DELETE USING (is_my_organization_project(project_id));

-- slots: プロジェクト経由で確認
CREATE POLICY "Users can select own org slots" ON slots
    FOR SELECT USING (is_my_organization_project(project_id));

CREATE POLICY "Users can insert own org slots" ON slots
    FOR INSERT WITH CHECK (is_my_organization_project(project_id));

CREATE POLICY "Users can update own org slots" ON slots
    FOR UPDATE USING (is_my_organization_project(project_id));

CREATE POLICY "Users can delete own org slots" ON slots
    FOR DELETE USING (is_my_organization_project(project_id));

-- slot_transitions: スロット経由で確認
CREATE POLICY "Users can select own org slot_transitions" ON slot_transitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
        )
    );

CREATE POLICY "Users can insert own org slot_transitions" ON slot_transitions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
        )
    );

CREATE POLICY "Users can update own org slot_transitions" ON slot_transitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
        )
    );

CREATE POLICY "Users can delete own org slot_transitions" ON slot_transitions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- conversion_rules: プロジェクト経由で確認
CREATE POLICY "Users can select own org conversion_rules" ON conversion_rules
    FOR SELECT USING (is_my_organization_project(project_id));

CREATE POLICY "Users can insert own org conversion_rules" ON conversion_rules
    FOR INSERT WITH CHECK (is_my_organization_project(project_id));

CREATE POLICY "Users can update own org conversion_rules" ON conversion_rules
    FOR UPDATE USING (is_my_organization_project(project_id));

CREATE POLICY "Users can delete own org conversion_rules" ON conversion_rules
    FOR DELETE USING (is_my_organization_project(project_id));

-- sessions: プロジェクト経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org sessions" ON sessions
    FOR SELECT USING (is_my_organization_project(project_id));

-- event_widget_opens: セッション経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org event_widget_opens" ON event_widget_opens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- event_video_starts: セッション経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org event_video_starts" ON event_video_starts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- event_video_views: セッション経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org event_video_views" ON event_video_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- event_clicks: セッション経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org event_clicks" ON event_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- event_conversions: セッション経由で確認（読み取りのみ）
CREATE POLICY "Users can select own org event_conversions" ON event_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
        )
    );

-- =============================================================================
-- Triggers
-- =============================================================================

-- ユーザー作成時に profiles レコードを自動作成
-- 注意: organization_id は設定しない（運営が手動で設定）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- organization_id を NULL で INSERT しようとするとエラーになる
    -- 初期運用では、ユーザー作成前に organization を作成し、
    -- ユーザー作成後に手動で profiles.organization_id を設定する
    -- または、招待フローで organization_id を指定する仕組みを実装する

    -- 現時点ではトリガーでは profiles を作成しない
    -- アプリケーション側で organization_id と共に作成する
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに updated_at トリガーを設定
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
    BEFORE UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_rules_updated_at
    BEFORE UPDATE ON conversion_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
