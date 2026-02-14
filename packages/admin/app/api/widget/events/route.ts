'use server'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role for widget API (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS headers for widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

type EventType =
  | 'widget_open'
  | 'video_start'
  | 'video_view'
  | 'click'
  | 'conversion'

interface BaseEventPayload {
  project_id: string
  session_id?: string
  event_type: EventType
}

interface WidgetOpenPayload extends BaseEventPayload {
  event_type: 'widget_open'
  referrer?: string
}

interface VideoStartPayload extends BaseEventPayload {
  event_type: 'video_start'
  slot_id: string
  video_id: string
}

interface VideoViewPayload extends BaseEventPayload {
  event_type: 'video_view'
  slot_id: string
  video_id: string
  played_seconds: number
}

interface ClickPayload extends BaseEventPayload {
  event_type: 'click'
  slot_id: string
  video_id: string
  button_type: string
  button_label: string
  destination_url?: string
  next_slot_id?: string
}

interface ConversionPayload extends BaseEventPayload {
  event_type: 'conversion'
  rule_id: string
  slot_id?: string
}

type EventPayload =
  | WidgetOpenPayload
  | VideoStartPayload
  | VideoViewPayload
  | ClickPayload
  | ConversionPayload

/**
 * セッションの検証または新規作成
 * - session_id あり → DB で存在 & project_id 一致を確認
 * - 不一致 or 未提供 → 新規セッション作成
 */
async function validateOrCreateSession(
  projectId: string,
  sessionId?: string
): Promise<{ sessionId: string; isNew: boolean }> {
  // session_id が提供された場合、DB で検証
  if (sessionId) {
    const { data: existing } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('project_id', projectId)
      .single()

    if (existing) {
      return { sessionId: existing.id, isNew: false }
    }
  }

  // 新規セッション作成
  const { data: newSession, error } = await supabaseAdmin
    .from('sessions')
    .insert({ project_id: projectId })
    .select('id')
    .single()

  if (error || !newSession) {
    throw new Error(`Failed to create session: ${error?.message}`)
  }

  return { sessionId: newSession.id, isNew: true }
}

export async function POST(request: NextRequest) {
  try {
    const payload: EventPayload = await request.json()

    // Validate required fields
    if (!payload.project_id || !payload.event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, event_type' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', payload.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid project_id' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Validate or create session
    let validSessionId: string
    let isNewSession = false
    try {
      const result = await validateOrCreateSession(
        payload.project_id,
        payload.session_id
      )
      validSessionId = result.sessionId
      isNewSession = result.isNew
    } catch (err) {
      console.error('Session validation error:', err)
      return NextResponse.json(
        { error: 'Failed to validate session' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Insert event based on type
    switch (payload.event_type) {
      case 'widget_open': {
        const widgetPayload = payload as WidgetOpenPayload
        const { error } = await supabaseAdmin
          .from('event_widget_opens')
          .insert({
            project_id: widgetPayload.project_id,
            session_id: validSessionId,
            referrer: widgetPayload.referrer || null,
          })

        if (error) {
          console.error('Widget open event error:', error)
          return NextResponse.json(
            { error: 'Failed to record event' },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case 'video_start': {
        const videoStartPayload = payload as VideoStartPayload
        if (!videoStartPayload.slot_id || !videoStartPayload.video_id) {
          return NextResponse.json(
            { error: 'Missing required fields for video_start event' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { error } = await supabaseAdmin
          .from('event_video_starts')
          .insert({
            project_id: videoStartPayload.project_id,
            session_id: validSessionId,
            slot_id: videoStartPayload.slot_id,
            video_id: videoStartPayload.video_id,
          })

        if (error) {
          console.error('Video start event error:', error)
          return NextResponse.json(
            { error: 'Failed to record event' },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case 'video_view': {
        const videoViewPayload = payload as VideoViewPayload
        if (
          !videoViewPayload.slot_id ||
          !videoViewPayload.video_id ||
          videoViewPayload.played_seconds === undefined
        ) {
          return NextResponse.json(
            {
              error: 'Missing required fields for video_view event',
            },
            { status: 400, headers: corsHeaders }
          )
        }

        const { error } = await supabaseAdmin.from('event_video_views').insert({
          project_id: videoViewPayload.project_id,
          session_id: validSessionId,
          slot_id: videoViewPayload.slot_id,
          video_id: videoViewPayload.video_id,
          played_seconds: videoViewPayload.played_seconds,
        })

        if (error) {
          console.error('Video view event error:', error)
          return NextResponse.json(
            { error: 'Failed to record event' },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case 'click': {
        const clickPayload = payload as ClickPayload
        if (
          !clickPayload.slot_id ||
          !clickPayload.video_id ||
          !clickPayload.button_type ||
          !clickPayload.button_label
        ) {
          return NextResponse.json(
            { error: 'Missing required fields for click event' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { error } = await supabaseAdmin.from('event_clicks').insert({
          project_id: clickPayload.project_id,
          session_id: validSessionId,
          slot_id: clickPayload.slot_id,
          video_id: clickPayload.video_id,
          click_type: clickPayload.button_type,
          target_label: clickPayload.button_label,
          target_url: clickPayload.destination_url || null,
          next_slot_id: clickPayload.next_slot_id || null,
        })

        if (error) {
          console.error('Click event error:', error)
          return NextResponse.json(
            { error: 'Failed to record event' },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case 'conversion': {
        const conversionPayload = payload as ConversionPayload
        if (!conversionPayload.rule_id) {
          return NextResponse.json(
            { error: 'Missing rule_id for conversion event' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { error } = await supabaseAdmin.from('event_conversions').insert({
          project_id: conversionPayload.project_id,
          session_id: validSessionId,
          conversion_rule_id: conversionPayload.rule_id,
        })

        if (error) {
          console.error('Conversion event error:', error)
          return NextResponse.json(
            { error: 'Failed to record event' },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid event_type' },
          { status: 400, headers: corsHeaders }
        )
    }

    return NextResponse.json(
      {
        success: true,
        ...(isNewSession ? { session_id: validSessionId } : {}),
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Widget events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
