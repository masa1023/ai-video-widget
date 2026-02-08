-- Bonsai Video Storage Configuration
-- This script creates storage buckets and policies for video files

-- =============================================================================
-- CREATE STORAGE BUCKET
-- =============================================================================

-- Create videos bucket for storing uploaded video files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    true,  -- Public access for widget playback
    104857600,  -- 100MB limit
    ARRAY['video/mp4', 'video/webm']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Public read access for video playback (widget needs this)
CREATE POLICY "videos_bucket_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');

-- Authenticated users can upload videos to their organization's folder
-- Path format: {organization_id}/{project_id}/{filename}
CREATE POLICY "videos_bucket_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1]::uuid = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Authenticated users can update their organization's videos
CREATE POLICY "videos_bucket_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1]::uuid = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );

-- Authenticated users can delete their organization's videos
CREATE POLICY "videos_bucket_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1]::uuid = get_user_organization_id()
        AND is_organization_active()
        AND can_edit()
    );