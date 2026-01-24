export type Organization = {
  id: string
  name: string
  widget_key: string
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  organization_id: string
  email: string
  display_name: string | null
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Video = {
  id: string
  project_id: string
  organization_id: string
  title: string
  description: string | null
  storage_path: string
  thumbnail_path: string | null
  duration_sec: number | null
  status: 'processing' | 'ready' | 'error'
  created_at: string
  updated_at: string
}

export type Slot = {
  id: string
  project_id: string
  organization_id: string
  name: string
  description: string | null
  is_entry_point: boolean
  video_id: string | null
  created_at: string
  updated_at: string
}

export type SlotTransition = {
  id: string
  from_slot_id: string
  to_slot_id: string
  trigger_type: 'time' | 'click' | 'auto'
  trigger_config: {
    time_sec?: number
    area?: { x: number; y: number; width: number; height: number }
  }
  priority: number
  created_at: string
}

export type ConversionRule = {
  id: string
  project_id: string
  organization_id: string
  name: string
  event_type: 'slot_reached' | 'video_completed' | 'cta_clicked'
  condition: {
    slot_id?: string
    video_id?: string
    cta_id?: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WidgetSession = {
  id: string
  project_id: string
  organization_id: string
  visitor_id: string
  started_at: string
  ended_at: string | null
  converted: boolean
  device_type: string | null
  browser: string | null
  referrer: string | null
}

export type EventSlotView = {
  id: string
  session_id: string
  slot_id: string
  video_id: string | null
  started_at: string
  ended_at: string | null
  watch_duration_sec: number | null
}

export type EventConversion = {
  id: string
  session_id: string
  rule_id: string
  converted_at: string
  metadata: Record<string, unknown> | null
}

// Extended types for UI
export type SlotWithVideo = Slot & {
  video: Video | null
}

export type SlotWithTransitions = Slot & {
  video: Video | null
  outgoing_transitions: (SlotTransition & { to_slot: Slot })[]
  incoming_transitions: (SlotTransition & { from_slot: Slot })[]
}

export type ProjectWithStats = Project & {
  video_count: number
  slot_count: number
  session_count: number
}

export type ConversionStats = {
  total_sessions: number
  converted_sessions: number
  conversion_rate: number
  avg_watch_time: number
}
