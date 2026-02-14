import type { Tables, Enums } from '@/lib/supabase/database.types'

// DB row type aliases
export type Video = Tables<'videos'>
export type Slot = Tables<'slots'>
export type Transition = Tables<'slot_transitions'>
export type ConversionRule = Tables<'conversion_rules'>
export type Project = Tables<'projects'>
export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>

// Enum aliases
export type MemberRole = Enums<'member_role'>
export type OrganizationStatus = Enums<'organization_status'>

// Joined types (Supabase join results)
export type SlotWithVideo = Slot & { video: Video }

// View-model types
export type Member = Pick<
  Profile,
  'id' | 'display_name' | 'role' | 'created_at'
> & {
  email: string
}

// Aggregation types
export interface AnalyticsData {
  widgetOpens: number
  videoStarts: number
  videoViews: number
  clicks: number
  conversions: number
  conversionRate: number
  slotStats: {
    slotId: string
    slotName: string
    videoTitle: string
    durationSeconds: number | null
    starts: number
    views: number
    totalPlayedSeconds: number
    avgPlayedSeconds: number
    avgPlayRate: number
  }[]
  clickBreakdown: {
    buttonType: string
    count: number
  }[]
  clickBySlot: {
    slotId: string
    slotName: string
    cta: number
    detail: number
    nextVideo: number
    total: number
  }[]
}
