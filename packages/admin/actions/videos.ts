'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Video } from '@/lib/types/database'

export async function getVideos(projectId?: string): Promise<Video[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return []

  let query = supabase
    .from('videos')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: videos, error } = await query

  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }

  return videos || []
}

export async function getVideo(id: string): Promise<Video | null> {
  const supabase = await createClient()
  
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching video:', error)
    return null
  }

  return video
}

export async function createVideo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found' }
  }

  const projectId = formData.get('projectId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const file = formData.get('file') as File | null

  if (!projectId || !title) {
    return { error: 'Project and title are required' }
  }

  // Verify project belongs to user's org
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  let storagePath = ''
  
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    storagePath = `${profile.organization_id}/${projectId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, file)

    if (uploadError) {
      console.error('Error uploading video:', uploadError)
      return { error: 'Failed to upload video' }
    }
  }

  const { data: video, error } = await supabase
    .from('videos')
    .insert({
      project_id: projectId,
      organization_id: profile.organization_id,
      title,
      description: description || null,
      storage_path: storagePath,
      status: storagePath ? 'ready' : 'processing',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating video:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/videos')
  return { video }
}

export async function updateVideo(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null

  if (!title) {
    return { error: 'Title is required' }
  }

  const { data: video, error } = await supabase
    .from('videos')
    .update({
      title,
      description: description || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating video:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${video.project_id}`)
  revalidatePath('/dashboard/videos')
  return { video }
}

export async function deleteVideo(id: string) {
  const supabase = await createClient()

  const { data: video } = await supabase
    .from('videos')
    .select('project_id, storage_path')
    .eq('id', id)
    .single()

  if (video?.storage_path) {
    await supabase.storage
      .from('videos')
      .remove([video.storage_path])
  }

  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting video:', error)
    return { error: error.message }
  }

  if (video) {
    revalidatePath(`/dashboard/projects/${video.project_id}`)
  }
  revalidatePath('/dashboard/videos')
  return { success: true }
}

export async function getVideoUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null
  
  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('videos')
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  return data?.signedUrl || null
}
