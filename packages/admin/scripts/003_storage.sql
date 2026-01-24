-- =============================================================================
-- STORAGE BUCKET SETUP
-- =============================================================================
-- Create a bucket for video files with proper RLS policies

-- Create the videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    true,  -- Public bucket for video playback
    104857600,  -- 100MB limit
    ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Policy: Allow authenticated users to upload videos to their organization's projects
DROP POLICY IF EXISTS "videos_upload_policy" ON storage.objects;
CREATE POLICY "videos_upload_policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id::text = (storage.foldername(name))[1]
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );

-- Policy: Allow public read access to videos (needed for widget playback)
DROP POLICY IF EXISTS "videos_read_policy" ON storage.objects;
CREATE POLICY "videos_read_policy" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'videos');

-- Policy: Allow authenticated users to update their organization's videos
DROP POLICY IF EXISTS "videos_update_policy" ON storage.objects;
CREATE POLICY "videos_update_policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id::text = (storage.foldername(name))[1]
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id::text = (storage.foldername(name))[1]
            AND projects.organization_id = public.get_user_organization_id()
        )
    );

-- Policy: Allow authenticated users to delete their organization's videos
DROP POLICY IF EXISTS "videos_delete_policy" ON storage.objects;
CREATE POLICY "videos_delete_policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id::text = (storage.foldername(name))[1]
            AND projects.organization_id = public.get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'admin')
        )
    );
