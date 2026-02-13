-- AI Video Widget - Initial Schema Migration
-- This migration creates all tables, indexes and RLS policies

-- =============================================================================
-- 1. organizations - 企業/組織（マルチテナント最上位単位）
-- =============================================================================
CREATE TYPE organization_status AS ENUM ('active', 'inactive');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status organization_status NOT NULL DEFAULT 'inactive',
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
    allowed_origins TEXT[],
    thumbnail_url TEXT,       -- サムネイル画像（縮小サークル表示用）のストレージパス
    background_url TEXT,      -- 背景画像（展開時の動画背景）のストレージパス
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_allowed_origins ON projects(allowed_origins);

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
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
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
    display_order INT NOT NULL DEFAULT 0,  -- 表示順
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_slot_id, to_slot_id)
);

CREATE INDEX idx_slot_transitions_from_slot_id ON slot_transitions(from_slot_id);
CREATE INDEX idx_slot_transitions_to_slot_id ON slot_transitions(to_slot_id);

-- =============================================================================
-- 7. conversion_rules - CV条件定義
-- =============================================================================
CREATE TABLE conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- 例: "予約完了", "お問い合わせ送信"
    rule_type TEXT NOT NULL DEFAULT 'url_match' CHECK (rule_type IN ('url_match', 'url_contains', 'url_regex')),
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
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    referrer TEXT,  -- ウィジェットを開いたページのURL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_widget_opens_project_id ON event_widget_opens(project_id);
CREATE INDEX idx_event_widget_opens_session_id ON event_widget_opens(session_id);
CREATE INDEX idx_event_widget_opens_created_at ON event_widget_opens(created_at);

-- =============================================================================
-- 10. event_video_starts - 動画再生開始イベント
-- =============================================================================
CREATE TABLE event_video_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_video_starts_project_id ON event_video_starts(project_id);
CREATE INDEX idx_event_video_starts_session_id ON event_video_starts(session_id);
CREATE INDEX idx_event_video_starts_video_id ON event_video_starts(video_id);
CREATE INDEX idx_event_video_starts_slot_id ON event_video_starts(slot_id);
CREATE INDEX idx_event_video_starts_created_at ON event_video_starts(created_at);

-- =============================================================================
-- 11. event_video_views - 動画視聴イベント
-- =============================================================================
CREATE TABLE event_video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    played_seconds FLOAT NOT NULL, -- Actual played duration in seconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_video_views_project_id ON event_video_views(project_id);
CREATE INDEX idx_event_video_views_session_id ON event_video_views(session_id);
CREATE INDEX idx_event_video_views_video_id ON event_video_views(video_id);
CREATE INDEX idx_event_video_views_slot_id ON event_video_views(slot_id);
CREATE INDEX idx_event_video_views_created_at ON event_video_views(created_at);

-- =============================================================================
-- 12. event_clicks - ボタンクリックイベント
-- =============================================================================
CREATE TABLE event_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
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

-- =============================================================================
-- 13. event_conversions - CV達成イベント
-- =============================================================================
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


-- Check if user's organization is active
CREATE OR REPLACE FUNCTION is_organization_active()
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = get_user_organization_id()
        AND o.status = 'active'
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in their organization
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS member_role AS $$
DECLARE
    user_role member_role;
BEGIN
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has edit permissions (owner or admin)
CREATE OR REPLACE FUNCTION can_edit()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'owner';
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
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Owners can view all profiles in their organization (for member management)
CREATE POLICY "Owners can view all profiles in their organization" ON profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id() 
        AND is_owner()
    );

-- organizations: 自分の組織のみ参照可能
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

-- Owners can update their organization details
CREATE POLICY "Owners can update their organization details" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id() 
        AND is_owner()
    )
    WITH CHECK (
        id = get_user_organization_id() 
        AND is_owner()
    );

-- projects: 自分の組織のプロジェクトのみアクセス可能
-- Users can view projects in their organization (when org is active)
CREATE POLICY "Users can view projects in their organization" ON projects
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
    );

-- Owners and admins can create projects
CREATE POLICY "Owners and admins can create projects" ON projects
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Owners and admins can update projects
CREATE POLICY "Owners and admins can update projects" ON projects
    FOR UPDATE USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Only owners can delete projects
CREATE POLICY "Only owners can delete projects" ON projects
    FOR DELETE USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND is_owner()
    );


-- videos: プロジェクト経由で確認
CREATE POLICY "Users can view videos in their organization" ON videos
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "Owners and admins can create videos" ON videos
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can update videos" ON videos
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can delete videos" ON videos
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

-- slots: プロジェクト経由で確認
CREATE POLICY "Users can view slots in their organization" ON slots
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "Owners and admins can create slots" ON slots
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can update slots" ON slots
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can delete slots" ON slots
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

-- slot_transitions: スロット経由で確認
CREATE POLICY "Users can view slot_transitions in their organization" ON slot_transitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "Owners and admins can create slot_transitions" ON slot_transitions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

CREATE POLICY "Owners and admins can update slot_transitions" ON slot_transitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

CREATE POLICY "Owners and admins can delete slot_transitions" ON slot_transitions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

-- conversion_rules: プロジェクト経由で確認
CREATE POLICY "Users can view conversion_rules in their organization" ON conversion_rules
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "Owners and admins can create conversion_rules" ON conversion_rules
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can update conversion_rules" ON conversion_rules
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "Owners and admins can delete conversion_rules" ON conversion_rules
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

-- sessions: プロジェクト経由で確認（読み取りのみ）
CREATE POLICY "Users can view sessions in their organization" ON sessions
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- event_widget_opens: project_id で直接確認（読み取りのみ）
CREATE POLICY "Users can view event_widget_opens in their organization" ON event_widget_opens
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- event_video_starts: project_id で直接確認（読み取りのみ）
CREATE POLICY "Users can view event_video_starts in their organization" ON event_video_starts
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- event_video_views: project_id で直接確認（読み取りのみ）
CREATE POLICY "Users can view event_video_views in their organization" ON event_video_views
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- event_clicks: project_id で直接確認（読み取りのみ）
CREATE POLICY "Users can view event_clicks in their organization" ON event_clicks
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- event_conversions: project_id で直接確認（読み取りのみ）
CREATE POLICY "Users can view event_conversions in their organization" ON event_conversions
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );
