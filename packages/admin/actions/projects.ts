'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/lib/types/database'

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return []

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return projects || []
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return project
}

export async function createProject(formData: FormData) {
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

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null

  if (!name) {
    return { error: 'Project name is required' }
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      description: description || null,
      organization_id: profile.organization_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/projects')
  return { project }
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null

  if (!name) {
    return { error: 'Project name is required' }
  }

  const { error } = await supabase
    .from('projects')
    .update({
      name,
      description: description || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating project:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  return { success: true }
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting project:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function getProjectStats(projectId: string) {
  const supabase = await createClient()

  const [videosResult, slotsResult, sessionsResult] = await Promise.all([
    supabase.from('videos').select('id', { count: 'exact' }).eq('project_id', projectId),
    supabase.from('slots').select('id', { count: 'exact' }).eq('project_id', projectId),
    supabase.from('widget_sessions').select('id', { count: 'exact' }).eq('project_id', projectId),
  ])

  return {
    videoCount: videosResult.count || 0,
    slotCount: slotsResult.count || 0,
    sessionCount: sessionsResult.count || 0,
  }
}
