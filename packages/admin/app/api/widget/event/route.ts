import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { sessionId, eventType, data: eventData, widgetKey } = await request.json()

    if (!sessionId || !eventType || !widgetKey) {
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

    switch (eventType) {
      case 'slot_view_start': {
        const { slotId, videoId } = eventData
        await supabaseAdmin
          .from('event_slot_views')
          .insert({
            session_id: sessionId,
            slot_id: slotId,
            video_id: videoId,
          })
        break
      }

      case 'slot_view_end': {
        const { slotId, watchDuration } = eventData
        await supabaseAdmin
          .from('event_slot_views')
          .update({
            ended_at: new Date().toISOString(),
            watch_duration_sec: watchDuration,
          })
          .eq('session_id', sessionId)
          .eq('slot_id', slotId)
          .is('ended_at', null)
        break
      }

      case 'video_completed': {
        const { slotId, videoId } = eventData
        // Check for conversion rules
        const { data: rules } = await supabaseAdmin
          .from('conversion_rules')
          .select('*')
          .eq('project_id', session.project_id)
          .eq('event_type', 'video_completed')
          .eq('is_active', true)

        for (const rule of rules || []) {
          const condition = rule.condition as { video_id?: string; slot_id?: string }
          const matchesVideo = !condition.video_id || condition.video_id === videoId
          const matchesSlot = !condition.slot_id || condition.slot_id === slotId

          if (matchesVideo && matchesSlot) {
            await supabaseAdmin
              .from('event_conversions')
              .insert({
                session_id: sessionId,
                rule_id: rule.id,
              })

            // Mark session as converted
            await supabaseAdmin
              .from('widget_sessions')
              .update({ converted: true })
              .eq('id', sessionId)
          }
        }
        break
      }

      case 'slot_reached': {
        const { slotId } = eventData
        // Check for conversion rules
        const { data: rules } = await supabaseAdmin
          .from('conversion_rules')
          .select('*')
          .eq('project_id', session.project_id)
          .eq('event_type', 'slot_reached')
          .eq('is_active', true)

        for (const rule of rules || []) {
          const condition = rule.condition as { slot_id?: string }
          const matchesSlot = !condition.slot_id || condition.slot_id === slotId

          if (matchesSlot) {
            await supabaseAdmin
              .from('event_conversions')
              .insert({
                session_id: sessionId,
                rule_id: rule.id,
              })

            await supabaseAdmin
              .from('widget_sessions')
              .update({ converted: true })
              .eq('id', sessionId)
          }
        }
        break
      }

      case 'session_end': {
        await supabaseAdmin
          .from('widget_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId)
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Widget event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
