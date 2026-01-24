-- Bonsai Video Database Schema
-- This script creates all tables, indexes, and relationships

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'admin', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Organizations: Top-level tenant unit
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles: User profiles linked to auth.users with organization membership
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role member_role NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Projects: Sites/projects under organizations
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON projects(domain);

-- Videos: Video master data
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration_seconds FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);

-- Slots: Navigation graph nodes
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    title TEXT,
    is_entry_point BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE INDEX IF NOT EXISTS idx_slots_project_id ON slots(project_id);
CREATE INDEX IF NOT EXISTS idx_slots_video_id ON slots(video_id);

-- Slot Transitions: Connections between slots
CREATE TABLE IF NOT EXISTS slot_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    to_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_slot_id, to_slot_id)
);

CREATE INDEX IF NOT EXISTS idx_slot_transitions_from_slot_id ON slot_transitions(from_slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_transitions_to_slot_id ON slot_transitions(to_slot_id);

-- Conversion Rules: CV condition definitions
CREATE TABLE IF NOT EXISTS conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL DEFAULT 'url_match' CHECK (rule_type IN ('url_match', 'url_contains', 'url_regex')),
    rule_value TEXT NOT NULL,
    attribution_days INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_rules_project_id ON conversion_rules(project_id);

-- Sessions: Widget user sessions (540-day validity)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- =============================================================================
-- EVENT TABLES
-- =============================================================================

-- Widget open events
CREATE TABLE IF NOT EXISTS event_widget_opens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_widget_opens_session_id ON event_widget_opens(session_id);
CREATE INDEX IF NOT EXISTS idx_event_widget_opens_created_at ON event_widget_opens(created_at);

-- Video start events
CREATE TABLE IF NOT EXISTS event_video_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_video_starts_session_id ON event_video_starts(session_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_video_id ON event_video_starts(video_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_slot_id ON event_video_starts(slot_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_created_at ON event_video_starts(created_at);

-- Video view events (recorded on pause/end)
CREATE TABLE IF NOT EXISTS event_video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    played_seconds FLOAT NOT NULL,
    duration_seconds FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_video_views_session_id ON event_video_views(session_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_video_id ON event_video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_slot_id ON event_video_views(slot_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_created_at ON event_video_views(created_at);

-- Click events
CREATE TABLE IF NOT EXISTS event_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    click_type TEXT NOT NULL CHECK (click_type IN ('cta', 'detail', 'transition')),
    target_label TEXT,
    target_url TEXT,
    next_slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_clicks_session_id ON event_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_event_clicks_slot_id ON event_clicks(slot_id);
CREATE INDEX IF NOT EXISTS idx_event_clicks_click_type ON event_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_event_clicks_created_at ON event_clicks(created_at);

-- Conversion events
CREATE TABLE IF NOT EXISTS event_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    conversion_rule_id UUID NOT NULL REFERENCES conversion_rules(id) ON DELETE CASCADE,
    last_video_start_id UUID REFERENCES event_video_starts(id) ON DELETE SET NULL,
    matched_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_conversions_session_id ON event_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_event_conversions_conversion_rule_id ON event_conversions(conversion_rule_id);
CREATE INDEX IF NOT EXISTS idx_event_conversions_created_at ON event_conversions(created_at);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_conversion_rules_updated_at BEFORE UPDATE ON conversion_rules
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
