'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Slot, SlotTransition } from '@/lib/types/database'

export async function getSlots(projectId: string): Promise<Slot[]> {
  const supabase = await createClient()
  
  const { data: slots, error } = await supabase
    .from('slots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching slots:', error)
    return []
  }

  return slots || []
}

export async function getSlotsWithTransitions(projectId: string) {
  const supabase = await createClient()
  
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('*, videos(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (slotsError) {
    console.error('Error fetching slots:', slotsError)
    return { slots: [], transitions: [] }
  }

  const slotIds = slots?.map(s => s.id) || []
  
  const { data: transitions, error: transError } = await supabase
    .from('slot_transitions')
    .select('*')
    .or(`from_slot_id.in.(${slotIds.join(',')}),to_slot_id.in.(${slotIds.join(',')})`)
    .order('priority', { ascending: true })

  if (transError && slotIds.length > 0) {
    console.error('Error fetching transitions:', transError)
  }

  return { 
    slots: slots || [], 
    transitions: transitions || [] 
  }
}

export async function createSlot(formData: FormData) {
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
  const description = formData.get('description') as string | null
  const videoId = formData.get('videoId') as string | null
  const isEntryPoint = formData.get('isEntryPoint') === 'true'

  if (!projectId || !name) {
    return { error: 'Project and name are required' }
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

  // If this is an entry point, unset other entry points
  if (isEntryPoint) {
    await supabase
      .from('slots')
      .update({ is_entry_point: false })
      .eq('project_id', projectId)
      .eq('is_entry_point', true)
  }

  const { data: slot, error } = await supabase
    .from('slots')
    .insert({
      project_id: projectId,
      organization_id: profile.organization_id,
      name,
      description: description || null,
      video_id: videoId || null,
      is_entry_point: isEntryPoint,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating slot:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { slot }
}

export async function updateSlot(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const videoId = formData.get('videoId') as string | null
  const isEntryPoint = formData.get('isEntryPoint') === 'true'

  if (!name) {
    return { error: 'Name is required' }
  }

  // If setting as entry point, unset others first
  if (isEntryPoint && projectId) {
    await supabase
      .from('slots')
      .update({ is_entry_point: false })
      .eq('project_id', projectId)
      .eq('is_entry_point', true)
      .neq('id', id)
  }

  const { data: slot, error } = await supabase
    .from('slots')
    .update({
      name,
      description: description || null,
      video_id: videoId || null,
      is_entry_point: isEntryPoint,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating slot:', error)
    return { error: error.message }
  }

  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`)
  }
  return { slot }
}

export async function deleteSlot(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting slot:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function createTransition(formData: FormData) {
  const supabase = await createClient()
  
  const fromSlotId = formData.get('fromSlotId') as string
  const toSlotId = formData.get('toSlotId') as string
  const triggerType = formData.get('triggerType') as 'time' | 'click' | 'auto'
  const timeSec = formData.get('timeSec') as string | null
  const priority = parseInt(formData.get('priority') as string) || 0

  if (!fromSlotId || !toSlotId) {
    return { error: 'From and To slots are required' }
  }

  const triggerConfig: Record<string, unknown> = {}
  if (triggerType === 'time' && timeSec) {
    triggerConfig.time_sec = parseFloat(timeSec)
  }

  const { data: transition, error } = await supabase
    .from('slot_transitions')
    .insert({
      from_slot_id: fromSlotId,
      to_slot_id: toSlotId,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      priority,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating transition:', error)
    return { error: error.message }
  }

  return { transition }
}

export async function deleteTransition(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('slot_transitions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting transition:', error)
    return { error: error.message }
  }

  return { success: true }
}
