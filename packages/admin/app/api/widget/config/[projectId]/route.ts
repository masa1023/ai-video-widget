import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role for widget API to bypass RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const origin = request.headers.get('origin') || ''

  try {
    // Get project and verify it exists and is active
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(
        `
        id,
        name,
        allowed_origins,
        organizations!inner (
          status
        )
      `
      )
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check organization is active
    const org = project.organizations
    if (org.status !== 'active') {
      return NextResponse.json(
        { error: 'Project not available' },
        { status: 403 }
      )
    }

    // Check origin is allowed (skip in development)
    if (process.env.NODE_ENV === 'production' && project.allowed_origins) {
      const originAllowed = project.allowed_origins.some((allowed: string) => {
        try {
          const allowedUrl = new URL(allowed)
          const requestUrl = new URL(origin)
          return allowedUrl.origin === requestUrl.origin
        } catch {
          return allowed === origin
        }
      })

      if (!originAllowed) {
        return NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403 }
        )
      }
    }

    // Get slots with their video info
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('slots')
      .select(
        `
        id,
        title,
        is_entry_point,
        detail_button_text,
        detail_button_url,
        cta_button_text,
        cta_button_url,
        videos (
          id,
          title,
          video_url,
          duration_seconds
        )
      `
      )
      .eq('project_id', projectId)

    if (slotsError) {
      return NextResponse.json(
        { error: 'Failed to load slots' },
        { status: 500 }
      )
    }

    // Get transitions
    const slotIds = (slots || []).map((s) => s.id)
    let transitions: { from_slot_id: string; to_slot_id: string }[] = []

    if (slotIds.length > 0) {
      const { data: transitionsData } = await supabaseAdmin
        .from('slot_transitions')
        .select('from_slot_id, to_slot_id')
        .in('from_slot_id', slotIds)

      transitions = transitionsData || []
    }

    // Build slot response with public video URLs
    const slotsWithUrls = (slots || []).map((slot) => {
      // slots.video_id is a FK to videos, so Supabase returns an object (not array)
      const video = slot.videos as unknown as {
        id: string
        title: string
        video_url: string
        duration_seconds: number
      } | null

      let videoUrl = null
      if (video?.video_url) {
        const { data } = supabaseAdmin.storage
          .from('videos')
          .getPublicUrl(video.video_url)

        videoUrl = data?.publicUrl || null
      }

      return {
        id: slot.id,
        name: slot.title,
        isEntryPoint: slot.is_entry_point,
        detailButtonText: slot.detail_button_text,
        detailButtonUrl: slot.detail_button_url,
        ctaButtonText: slot.cta_button_text,
        ctaButtonUrl: slot.cta_button_url,
        video: video
          ? {
              id: video.id,
              title: video.title,
              url: videoUrl,
              durationSeconds: video.duration_seconds,
            }
          : null,
      }
    })

    // Find entry point
    const entrySlot = slotsWithUrls.find((s) => s.isEntryPoint)

    const config = {
      projectId,
      entrySlotId: entrySlot?.id || null,
      slots: slotsWithUrls,
      transitions: transitions.map((t) => ({
        fromSlotId: t.from_slot_id,
        toSlotId: t.to_slot_id,
      })),
    }

    return NextResponse.json(config, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('Widget config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
