-- Bonsai Video Database Schema
-- This script creates all tables, indexes, and RLS policies for the application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles within an organization
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'viewer');

-- Conversion rule match types
CREATE TYPE rule_type AS ENUM ('url_match', 'url_contains', 'url_regex');

-- Click event types
CREATE TYPE click_type AS ENUM ('cta', 'detail', 'transition');

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PROFILES TABLE (links auth.users to organizations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by organization
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by organization
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- =============================================================================
-- VIDEOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration_seconds REAL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_videos_project_id ON public.videos(project_id);

-- =============================================================================
-- SLOTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    slot_key TEXT NOT NULL,
    title TEXT,
    is_entry_point BOOLEAN NOT NULL DEFAULT FALSE,
    detail_button_text TEXT,
    detail_button_url TEXT,
    cta_button_text TEXT,
    cta_button_url TEXT,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, slot_key)
);

-- Index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_slots_project_id ON public.slots(project_id);

-- =============================================================================
-- SLOT_TRANSITIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.slot_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
    to_slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
    button_label TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_slot_id, to_slot_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_slot_transitions_from_slot_id ON public.slot_transitions(from_slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_transitions_to_slot_id ON public.slot_transitions(to_slot_id);

-- =============================================================================
-- CONVERSION_RULES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rule_type rule_type NOT NULL DEFAULT 'url_match',
    rule_value TEXT NOT NULL,
    attribution_days INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_conversion_rules_project_id ON public.conversion_rules(project_id);

-- =============================================================================
-- SESSIONS TABLE (for analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, session_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON public.sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);

-- =============================================================================
-- EVENT TABLES (for analytics)
-- =============================================================================

-- Widget open events
CREATE TABLE IF NOT EXISTS public.event_widget_opens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_widget_opens_project_id ON public.event_widget_opens(project_id);
CREATE INDEX IF NOT EXISTS idx_event_widget_opens_session_id ON public.event_widget_opens(session_id);
CREATE INDEX IF NOT EXISTS idx_event_widget_opens_created_at ON public.event_widget_opens(created_at);

-- Video start events
CREATE TABLE IF NOT EXISTS public.event_video_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_video_starts_project_id ON public.event_video_starts(project_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_session_id ON public.event_video_starts(session_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_video_id ON public.event_video_starts(video_id);
CREATE INDEX IF NOT EXISTS idx_event_video_starts_created_at ON public.event_video_starts(created_at);

-- Video view events (tracking watch progress)
CREATE TABLE IF NOT EXISTS public.event_video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    played_seconds REAL NOT NULL DEFAULT 0,
    duration_seconds REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_video_views_project_id ON public.event_video_views(project_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_session_id ON public.event_video_views(session_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_video_id ON public.event_video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_event_video_views_created_at ON public.event_video_views(created_at);

-- Click events
CREATE TABLE IF NOT EXISTS public.event_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
    click_type click_type NOT NULL,
    target_label TEXT,
    target_url TEXT,
    next_slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_clicks_project_id ON public.event_clicks(project_id);
CREATE INDEX IF NOT EXISTS idx_event_clicks_session_id ON public.event_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_event_clicks_created_at ON public.event_clicks(created_at);

-- Conversion events
CREATE TABLE IF NOT EXISTS public.event_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    conversion_rule_id UUID REFERENCES public.conversion_rules(id) ON DELETE SET NULL,
    matched_url TEXT,
    last_video_start_id UUID REFERENCES public.event_video_starts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_conversions_project_id ON public.event_conversions(project_id);
CREATE INDEX IF NOT EXISTS idx_event_conversions_session_id ON public.event_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_event_conversions_conversion_rule_id ON public.event_conversions(conversion_rule_id);
CREATE INDEX IF NOT EXISTS idx_event_conversions_created_at ON public.event_conversions(created_at);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_videos ON public.videos;
CREATE TRIGGER set_updated_at_videos
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_slots ON public.slots;
CREATE TRIGGER set_updated_at_slots
    BEFORE UPDATE ON public.slots
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_conversion_rules ON public.conversion_rules;
CREATE TRIGGER set_updated_at_conversion_rules
    BEFORE UPDATE ON public.conversion_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
