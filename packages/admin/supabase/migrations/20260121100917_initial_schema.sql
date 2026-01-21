-- AI Video Widget - Initial Schema Migration
-- This migration creates all tables, indexes, and RLS policies

-- =============================================================================
-- 1. projects - プロジェクト（マルチテナント単位）
-- =============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,  -- 例: "example.com"（オプション）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_domain ON projects(domain);

-- =============================================================================
-- 2. videos - 動画マスタ
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
-- 3. slots - スロット = ナビゲーションノード
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
-- 4. slot_transitions - スロット間遷移
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
-- 5. conversion_rules - CV条件定義
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
-- 6. sessions - セッション
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
-- 7. event_widget_opens - ウィジェット展開イベント
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
-- 8. event_video_starts - 動画再生開始イベント
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
-- 9. event_video_milestones - 再生進捗イベント
-- =============================================================================
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

-- =============================================================================
-- 10. event_clicks - ボタンクリックイベント
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
-- 11. event_conversions - CV達成イベント
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
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_widget_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_video_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_video_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_conversions ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
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

CREATE POLICY "Service role full access" ON event_video_milestones
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_clicks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON event_conversions
    FOR ALL USING (auth.role() = 'service_role');
