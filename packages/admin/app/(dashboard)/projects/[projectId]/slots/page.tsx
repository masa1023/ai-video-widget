'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SlotGraphEditor } from '@/components/dashboard/slot-graph-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Video, SlotWithVideo, Transition } from '@/lib/types'

export default function SlotsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [videos, setVideos] = useState<Video[]>([])
  const [slots, setSlots] = useState<SlotWithVideo[]>([])
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setUserRole(profile?.role || null)

    // Get videos (for create slot dialog)
    const { data: videosData } = await supabase
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .order('title')

    setVideos(videosData || [])

    // Get slots with joined video
    const { data: slotsData } = await supabase
      .from('slots')
      .select('*, video:videos!inner(*)')
      .eq('project_id', projectId)
      .order('created_at')

    setSlots((slotsData as unknown as SlotWithVideo[]) || [])

    // Get transitions
    if (slotsData && slotsData.length > 0) {
      const slotIds = slotsData.map((s) => s.id)
      const { data: transitionsData } = await supabase
        .from('slot_transitions')
        .select('*')
        .in('from_slot_id', slotIds)

      setTransitions(transitionsData || [])
    }

    setIsLoading(false)
  }, [projectId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const canEdit = userRole === 'owner' || userRole === 'admin'

  const handleSlotCreate = async (slot: Partial<SlotWithVideo>) => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('slots')
      .insert({
        project_id: projectId,
        video_id: slot.video_id!,
        title: slot.title!,
        is_entry_point: slot.is_entry_point || false,
        position_x: slot.position_x || 0,
        position_y: slot.position_y || 0,
      })
      .select('*, video:videos!inner(*)')
      .single()

    if (error) {
      toast.error(error.message)
      return null
    }

    setSlots([...slots, data as unknown as SlotWithVideo])
    toast.success('Slot created')
    return data as unknown as SlotWithVideo
  }

  const handleSlotUpdate = async (id: string, updates: Partial<SlotWithVideo>) => {
    const supabase = createClient()

    // If setting as entry point, unset others
    if (updates.is_entry_point) {
      await supabase
        .from('slots')
        .update({ is_entry_point: false })
        .eq('project_id', projectId)
        .neq('id', id)
    }

    // Exclude video from updates (it's a joined field)
    const { video, ...dbUpdates } = updates
    const { error } = await supabase
      .from('slots')
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return false
    }

    setSlots(
      slots.map((s) => {
        if (s.id === id) {
          return { ...s, ...updates }
        }
        if (updates.is_entry_point && s.is_entry_point) {
          return { ...s, is_entry_point: false }
        }
        return s
      })
    )

    return true
  }

  const handleSlotDelete = async (id: string) => {
    const supabase = createClient()

    // Delete transitions first
    await supabase.from('slot_transitions').delete().eq('from_slot_id', id)
    await supabase.from('slot_transitions').delete().eq('to_slot_id', id)

    const { error } = await supabase.from('slots').delete().eq('id', id)

    if (error) {
      toast.error(error.message)
      return false
    }

    setSlots(slots.filter((s) => s.id !== id))
    setTransitions(
      transitions.filter((t) => t.from_slot_id !== id && t.to_slot_id !== id)
    )
    toast.success('Slot deleted')
    return true
  }

  const handleTransitionCreate = async (
    fromSlotId: string,
    toSlotId: string
  ) => {
    const supabase = createClient()

    // Check if transition already exists
    const exists = transitions.some(
      (t) => t.from_slot_id === fromSlotId && t.to_slot_id === toSlotId
    )
    if (exists) {
      toast.error('Transition already exists')
      return null
    }

    const { data, error } = await supabase
      .from('slot_transitions')
      .insert({
        from_slot_id: fromSlotId,
        to_slot_id: toSlotId,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      return null
    }

    setTransitions([...transitions, data])
    return data
  }

  const handleTransitionDelete = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('slot_transitions')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return false
    }

    setTransitions(transitions.filter((t) => t.id !== id))
    return true
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <SlotGraphEditor
        videos={videos}
        slots={slots}
        transitions={transitions}
        canEdit={canEdit}
        onSlotCreate={handleSlotCreate}
        onSlotUpdate={handleSlotUpdate}
        onSlotDelete={handleSlotDelete}
        onTransitionCreate={handleTransitionCreate}
        onTransitionDelete={handleTransitionDelete}
      />
    </div>
  )
}
