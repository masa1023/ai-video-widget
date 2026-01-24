import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create an admin client for widget APIs (no RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { projectId, widgetKey, visitorId, deviceType, browser, referrer } = await request.json()

    if (!projectId || !widgetKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify widget key matches the organization
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, organization_id, organizations!inner(widget_key)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const org = project.organizations as { widget_key: string }
    if (org.widget_key !== widgetKey) {
      return NextResponse.json({ error: 'Invalid widget key' }, { status: 403 })
    }

    // Get entry point slot with video
    const { data: entrySlot, error: slotError } = await supabaseAdmin
      .from('slots')
      .select('*, videos(*)')
      .eq('project_id', projectId)
      .eq('is_entry_point', true)
      .single()

    if (slotError || !entrySlot) {
      return NextResponse.json({ error: 'No entry point configured' }, { status: 404 })
    }

    // Create session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('widget_sessions')
      .insert({
        project_id: projectId,
        organization_id: project.organization_id,
        visitor_id: visitorId,
        device_type: deviceType,
        browser,
        referrer,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Get transitions from entry slot
    const { data: transitions } = await supabaseAdmin
      .from('slot_transitions')
      .select('*, to_slot:slots!to_slot_id(*)')
      .eq('from_slot_id', entrySlot.id)
      .order('priority', { ascending: true })

    // Get video signed URL if exists
    let videoUrl = null
    if (entrySlot.videos?.storage_path) {
      const { data } = await supabaseAdmin.storage
        .from('videos')
        .createSignedUrl(entrySlot.videos.storage_path, 3600)
      videoUrl = data?.signedUrl
    }

    return NextResponse.json({
      sessionId: session.id,
      slot: {
        id: entrySlot.id,
        name: entrySlot.name,
        video: entrySlot.videos ? {
          id: entrySlot.videos.id,
          title: entrySlot.videos.title,
          url: videoUrl,
          duration: entrySlot.videos.duration_sec,
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
    console.error('Widget init error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
