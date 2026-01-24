-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This script enables RLS and creates all necessary policies for secure access

-- =============================================================================
-- HELPER FUNCTION: Get user's organization_id
-- =============================================================================
-- This function is used in RLS policies to get the current user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_widget_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_video_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_conversions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- Users can only see and manage their own profile
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Note: INSERT for profiles is done by admin via service_role, not by users directly
-- Users should not be able to create their own profiles to prevent security issues

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- Users can only see their own organization
-- =============================================================================
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
CREATE POLICY "organizations_select_own" ON public.organizations
    FOR SELECT
    USING (id = public.get_user_organization_id());

-- Only owners can update organization (done via service_role in practice)
DROP POLICY IF EXISTS "organizations_update_own" ON public.organizations;
CREATE POLICY "organizations_update_own" ON public.organizations
    FOR UPDATE
    USING (
        id = public.get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'owner'
        )
    )
    WITH CHECK (
        id = public.get_user_organization_id()
    );

-- =============================================================================
-- PROJECTS POLICIES
-- Users can only access projects in their organization
-- =============================================================================
DROP POLICY IF EXISTS "projects_select_org" ON public.projects;
CREATE POLICY "projects_select_org" ON public.projects
    FOR SELECT
    USING (organization_id = public.get_user_organization_id());

-- Only admin or owner can create projects
DROP POLICY IF EXISTS "projects_insert_org" ON public.projects;
CREATE POLICY "projects_insert_org" ON public.projects
    FOR INSERT
    WITH CHECK (
        organization_id = public.get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Only admin or owner can update projects
DROP POLICY IF EXISTS "projects_update_org" ON public.projects;
CREATE POLICY "projects_update_org" ON public.projects
    FOR UPDATE
    USING (
        organization_id = public.get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        organization_id = public.get_user_organization_id()
    );

-- Only owner can delete projects
DROP POLICY IF EXISTS "projects_delete_org" ON public.projects;
CREATE POLICY "projects_delete_org" ON public.projects
    FOR DELETE
    USING (
        organization_id = public.get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'owner'
        )
    );

-- =============================================================================
-- VIDEOS POLICIES
-- Users can only access videos in their organization's projects
-- =============================================================================
DROP POLICY IF EXISTS "videos_select_org" ON public.videos;
CREATE POLICY "videos_select_org" ON public.videos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = videos.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can insert videos
DROP POLICY IF EXISTS "videos_insert_org" ON public.videos;
CREATE POLICY "videos_insert_org" ON public.videos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = videos.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Only admin or owner can update videos
DROP POLICY IF EXISTS "videos_update_org" ON public.videos;
CREATE POLICY "videos_update_org" ON public.videos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = videos.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = videos.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can delete videos
DROP POLICY IF EXISTS "videos_delete_org" ON public.videos;
CREATE POLICY "videos_delete_org" ON public.videos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = videos.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- SLOTS POLICIES
-- Users can only access slots in their organization's projects
-- =============================================================================
DROP POLICY IF EXISTS "slots_select_org" ON public.slots;
CREATE POLICY "slots_select_org" ON public.slots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = slots.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can insert slots
DROP POLICY IF EXISTS "slots_insert_org" ON public.slots;
CREATE POLICY "slots_insert_org" ON public.slots
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = slots.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Only admin or owner can update slots
DROP POLICY IF EXISTS "slots_update_org" ON public.slots;
CREATE POLICY "slots_update_org" ON public.slots
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = slots.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = slots.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can delete slots
DROP POLICY IF EXISTS "slots_delete_org" ON public.slots;
CREATE POLICY "slots_delete_org" ON public.slots
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = slots.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- SLOT_TRANSITIONS POLICIES
-- Access controlled via related slots
-- =============================================================================
DROP POLICY IF EXISTS "slot_transitions_select_org" ON public.slot_transitions;
CREATE POLICY "slot_transitions_select_org" ON public.slot_transitions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.slots
            JOIN public.projects ON projects.id = slots.project_id
            WHERE slots.id = slot_transitions.from_slot_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can insert transitions
DROP POLICY IF EXISTS "slot_transitions_insert_org" ON public.slot_transitions;
CREATE POLICY "slot_transitions_insert_org" ON public.slot_transitions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.slots
            JOIN public.projects ON projects.id = slots.project_id
            WHERE slots.id = slot_transitions.from_slot_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Only admin or owner can update transitions
DROP POLICY IF EXISTS "slot_transitions_update_org" ON public.slot_transitions;
CREATE POLICY "slot_transitions_update_org" ON public.slot_transitions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.slots
            JOIN public.projects ON projects.id = slots.project_id
            WHERE slots.id = slot_transitions.from_slot_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.slots
            JOIN public.projects ON projects.id = slots.project_id
            WHERE slots.id = slot_transitions.from_slot_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can delete transitions
DROP POLICY IF EXISTS "slot_transitions_delete_org" ON public.slot_transitions;
CREATE POLICY "slot_transitions_delete_org" ON public.slot_transitions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.slots
            JOIN public.projects ON projects.id = slots.project_id
            WHERE slots.id = slot_transitions.from_slot_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- CONVERSION_RULES POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "conversion_rules_select_org" ON public.conversion_rules;
CREATE POLICY "conversion_rules_select_org" ON public.conversion_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = conversion_rules.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can insert rules
DROP POLICY IF EXISTS "conversion_rules_insert_org" ON public.conversion_rules;
CREATE POLICY "conversion_rules_insert_org" ON public.conversion_rules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = conversion_rules.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Only admin or owner can update rules
DROP POLICY IF EXISTS "conversion_rules_update_org" ON public.conversion_rules;
CREATE POLICY "conversion_rules_update_org" ON public.conversion_rules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = conversion_rules.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = conversion_rules.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Only admin or owner can delete rules
DROP POLICY IF EXISTS "conversion_rules_delete_org" ON public.conversion_rules;
CREATE POLICY "conversion_rules_delete_org" ON public.conversion_rules
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = conversion_rules.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- SESSIONS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "sessions_select_org" ON public.sessions;
CREATE POLICY "sessions_select_org" ON public.sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = sessions.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Sessions are inserted via service_role from the widget API, not by authenticated users

-- =============================================================================
-- EVENT_WIDGET_OPENS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "event_widget_opens_select_org" ON public.event_widget_opens;
CREATE POLICY "event_widget_opens_select_org" ON public.event_widget_opens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = event_widget_opens.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- EVENT_VIDEO_STARTS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "event_video_starts_select_org" ON public.event_video_starts;
CREATE POLICY "event_video_starts_select_org" ON public.event_video_starts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = event_video_starts.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- EVENT_VIDEO_VIEWS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "event_video_views_select_org" ON public.event_video_views;
CREATE POLICY "event_video_views_select_org" ON public.event_video_views
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = event_video_views.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- EVENT_CLICKS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "event_clicks_select_org" ON public.event_clicks;
CREATE POLICY "event_clicks_select_org" ON public.event_clicks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = event_clicks.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- EVENT_CONVERSIONS POLICIES (Read-only for authenticated users)
-- =============================================================================
DROP POLICY IF EXISTS "event_conversions_select_org" ON public.event_conversions;
CREATE POLICY "event_conversions_select_org" ON public.event_conversions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = event_conversions.project_id
            AND projects.organization_id = public.get_user_organization_id()
        )
    );
