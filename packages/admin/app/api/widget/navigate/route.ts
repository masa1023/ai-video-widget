import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { sessionId, slotId, widgetKey } = await request.json()

    if (!sessionId || !slotId || !widgetKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('widget_sessions')
      .select('id, project_id, organization_id, projects!inner(organizations!inner(widget_key))')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const org = (session.projects as { organizations: { widget_key: string } }).organizations
    if (org.widget_key !== widgetKey) {
      return NextResponse.json({ error: 'Invalid widget key' }, { status: 403 })
    }

    // Get the target slot with video
    const { data: slot, error: slotError } = await supabaseAdmin
      .from('slots')
      .select('*, videos(*)')
      .eq('id', slotId)
      .eq('project_id', session.project_id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    // Get transitions from this slot
    const { data: transitions } = await supabaseAdmin
      .from('slot_transitions')
      .select('*, to_slot:slots!to_slot_id(*)')
      .eq('from_slot_id', slotId)
      .order('priority', { ascending: true })

    // Get video signed URL if exists
    let videoUrl = null
    if (slot.videos?.storage_path) {
      const { data } = await supabaseAdmin.storage
        .from('videos')
        .createSignedUrl(slot.videos.storage_path, 3600)
      videoUrl = data?.signedUrl
    }

    return NextResponse.json({
      slot: {
        id: slot.id,
        name: slot.name,
        video: slot.videos ? {
          id: slot.videos.id,
          title: slot.videos.title,
          url: videoUrl,
          duration: slot.videos.duration_sec,
        } : null,
      },
      transitions: (transitions || []).map(t => ({
        id: t.id,
        triggerType: t.trigger_type,
        triggerConfig: t.trigger_config,
        toSlot: {
          id: t.to_slot.id,
          name: t.to_slot.name,
        },
      })),
    })
  } catch (error) {
    console.error('Widget navigate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
