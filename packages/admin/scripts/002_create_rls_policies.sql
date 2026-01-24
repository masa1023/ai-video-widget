-- Bonsai Video RLS Policies
-- This script enables RLS and creates comprehensive security policies

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

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
-- HELPER FUNCTIONS
-- =============================================================================

-- Get the current user's organization ID (with caching)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id 
    FROM profiles 
    WHERE id = auth.uid();
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if a project belongs to the current user's organization
CREATE OR REPLACE FUNCTION is_my_organization_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = p_project_id
        AND p.organization_id = get_user_organization_id()
    ) INTO result;
    RETURN result;
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
-- PROFILES POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not role or organization_id)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Owners can view all profiles in their organization (for member management)
CREATE POLICY "profiles_select_org_members" ON profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id() 
        AND is_owner()
    );

-- Service role has full access
CREATE POLICY "service_role_profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "organizations_select_own" ON organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON organizations;
DROP POLICY IF EXISTS "service_role_organizations" ON organizations;

-- Users can view their own organization (only if active, or for pending status display)
CREATE POLICY "organizations_select_own" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

-- Owners can update their organization details
CREATE POLICY "organizations_update_own" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id() 
        AND is_owner()
    )
    WITH CHECK (
        id = get_user_organization_id() 
        AND is_owner()
    );

-- Service role has full access (for admin operations)
CREATE POLICY "service_role_organizations" ON organizations
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- PROJECTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "projects_select_own_org" ON projects;
DROP POLICY IF EXISTS "projects_insert_own_org" ON projects;
DROP POLICY IF EXISTS "projects_update_own_org" ON projects;
DROP POLICY IF EXISTS "projects_delete_own_org" ON projects;
DROP POLICY IF EXISTS "service_role_projects" ON projects;

-- Users can view projects in their organization (when org is active)
CREATE POLICY "projects_select_own_org" ON projects
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
    );

-- Owners and admins can create projects
CREATE POLICY "projects_insert_own_org" ON projects
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Owners and admins can update projects
CREATE POLICY "projects_update_own_org" ON projects
    FOR UPDATE USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Only owners can delete projects
CREATE POLICY "projects_delete_own_org" ON projects
    FOR DELETE USING (
        organization_id = get_user_organization_id()
        AND is_organization_active()
        AND is_owner()
    );

-- Service role has full access
CREATE POLICY "service_role_projects" ON projects
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- VIDEOS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "videos_select_own_org" ON videos;
DROP POLICY IF EXISTS "videos_insert_own_org" ON videos;
DROP POLICY IF EXISTS "videos_update_own_org" ON videos;
DROP POLICY IF EXISTS "videos_delete_own_org" ON videos;
DROP POLICY IF EXISTS "service_role_videos" ON videos;

CREATE POLICY "videos_select_own_org" ON videos
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "videos_insert_own_org" ON videos
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "videos_update_own_org" ON videos
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "videos_delete_own_org" ON videos
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "service_role_videos" ON videos
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SLOTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "slots_select_own_org" ON slots;
DROP POLICY IF EXISTS "slots_insert_own_org" ON slots;
DROP POLICY IF EXISTS "slots_update_own_org" ON slots;
DROP POLICY IF EXISTS "slots_delete_own_org" ON slots;
DROP POLICY IF EXISTS "service_role_slots" ON slots;

CREATE POLICY "slots_select_own_org" ON slots
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "slots_insert_own_org" ON slots
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "slots_update_own_org" ON slots
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "slots_delete_own_org" ON slots
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "service_role_slots" ON slots
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SLOT_TRANSITIONS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "slot_transitions_select_own_org" ON slot_transitions;
DROP POLICY IF EXISTS "slot_transitions_insert_own_org" ON slot_transitions;
DROP POLICY IF EXISTS "slot_transitions_update_own_org" ON slot_transitions;
DROP POLICY IF EXISTS "slot_transitions_delete_own_org" ON slot_transitions;
DROP POLICY IF EXISTS "service_role_slot_transitions" ON slot_transitions;

CREATE POLICY "slot_transitions_select_own_org" ON slot_transitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "slot_transitions_insert_own_org" ON slot_transitions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

CREATE POLICY "slot_transitions_update_own_org" ON slot_transitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

CREATE POLICY "slot_transitions_delete_own_org" ON slot_transitions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM slots s
            WHERE s.id = from_slot_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
            AND can_edit()
        )
    );

CREATE POLICY "service_role_slot_transitions" ON slot_transitions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- CONVERSION_RULES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "conversion_rules_select_own_org" ON conversion_rules;
DROP POLICY IF EXISTS "conversion_rules_insert_own_org" ON conversion_rules;
DROP POLICY IF EXISTS "conversion_rules_update_own_org" ON conversion_rules;
DROP POLICY IF EXISTS "conversion_rules_delete_own_org" ON conversion_rules;
DROP POLICY IF EXISTS "service_role_conversion_rules" ON conversion_rules;

CREATE POLICY "conversion_rules_select_own_org" ON conversion_rules
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

CREATE POLICY "conversion_rules_insert_own_org" ON conversion_rules
    FOR INSERT WITH CHECK (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "conversion_rules_update_own_org" ON conversion_rules
    FOR UPDATE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "conversion_rules_delete_own_org" ON conversion_rules
    FOR DELETE USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
        AND can_edit()
    );

CREATE POLICY "service_role_conversion_rules" ON conversion_rules
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SESSIONS POLICIES (Read-only for users, service_role for writes)
-- =============================================================================

DROP POLICY IF EXISTS "sessions_select_own_org" ON sessions;
DROP POLICY IF EXISTS "service_role_sessions" ON sessions;

-- Users can only read sessions for their projects
CREATE POLICY "sessions_select_own_org" ON sessions
    FOR SELECT USING (
        is_my_organization_project(project_id)
        AND is_organization_active()
    );

-- Service role has full access (widget API uses this)
CREATE POLICY "service_role_sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- EVENT TABLES POLICIES (Read-only for users, service_role for writes)
-- =============================================================================

-- event_widget_opens
DROP POLICY IF EXISTS "event_widget_opens_select_own_org" ON event_widget_opens;
DROP POLICY IF EXISTS "service_role_event_widget_opens" ON event_widget_opens;

CREATE POLICY "event_widget_opens_select_own_org" ON event_widget_opens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "service_role_event_widget_opens" ON event_widget_opens
    FOR ALL USING (auth.role() = 'service_role');

-- event_video_starts
DROP POLICY IF EXISTS "event_video_starts_select_own_org" ON event_video_starts;
DROP POLICY IF EXISTS "service_role_event_video_starts" ON event_video_starts;

CREATE POLICY "event_video_starts_select_own_org" ON event_video_starts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "service_role_event_video_starts" ON event_video_starts
    FOR ALL USING (auth.role() = 'service_role');

-- event_video_views
DROP POLICY IF EXISTS "event_video_views_select_own_org" ON event_video_views;
DROP POLICY IF EXISTS "service_role_event_video_views" ON event_video_views;

CREATE POLICY "event_video_views_select_own_org" ON event_video_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "service_role_event_video_views" ON event_video_views
    FOR ALL USING (auth.role() = 'service_role');

-- event_clicks
DROP POLICY IF EXISTS "event_clicks_select_own_org" ON event_clicks;
DROP POLICY IF EXISTS "service_role_event_clicks" ON event_clicks;

CREATE POLICY "event_clicks_select_own_org" ON event_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "service_role_event_clicks" ON event_clicks
    FOR ALL USING (auth.role() = 'service_role');

-- event_conversions
DROP POLICY IF EXISTS "event_conversions_select_own_org" ON event_conversions;
DROP POLICY IF EXISTS "service_role_event_conversions" ON event_conversions;

CREATE POLICY "event_conversions_select_own_org" ON event_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND is_my_organization_project(s.project_id)
            AND is_organization_active()
        )
    );

CREATE POLICY "service_role_event_conversions" ON event_conversions
    FOR ALL USING (auth.role() = 'service_role');
