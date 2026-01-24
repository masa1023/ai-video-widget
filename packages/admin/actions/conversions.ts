'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ConversionRule } from '@/lib/types/database'

export async function getConversionRules(projectId: string): Promise<ConversionRule[]> {
  const supabase = await createClient()
  
  const { data: rules, error } = await supabase
    .from('conversion_rules')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversion rules:', error)
    return []
  }

  return rules || []
}

export async function createConversionRule(formData: FormData) {
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
  const name = formData.get('name') as string
  const eventType = formData.get('eventType') as 'slot_reached' | 'video_completed' | 'cta_clicked'
  const slotId = formData.get('slotId') as string | null
  const videoId = formData.get('videoId') as string | null
  const isActive = formData.get('isActive') === 'true'

  if (!projectId || !name || !eventType) {
    return { error: 'Project, name, and event type are required' }
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

  const condition: Record<string, string> = {}
  if (slotId) condition.slot_id = slotId
  if (videoId) condition.video_id = videoId

  const { data: rule, error } = await supabase
    .from('conversion_rules')
    .insert({
      project_id: projectId,
      organization_id: profile.organization_id,
      name,
      event_type: eventType,
      condition,
      is_active: isActive,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversion rule:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { rule }
}

export async function updateConversionRule(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  const eventType = formData.get('eventType') as 'slot_reached' | 'video_completed' | 'cta_clicked'
  const slotId = formData.get('slotId') as string | null
  const videoId = formData.get('videoId') as string | null
  const isActive = formData.get('isActive') === 'true'

  if (!name || !eventType) {
    return { error: 'Name and event type are required' }
  }

  const condition: Record<string, string> = {}
  if (slotId) condition.slot_id = slotId
  if (videoId) condition.video_id = videoId

  const { data: rule, error } = await supabase
    .from('conversion_rules')
    .update({
      name,
      event_type: eventType,
      condition,
      is_active: isActive,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating conversion rule:', error)
    return { error: error.message }
  }

  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`)
  }
  return { rule }
}

export async function deleteConversionRule(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conversion_rules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting conversion rule:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function toggleConversionRule(id: string, isActive: boolean, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conversion_rules')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling conversion rule:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
