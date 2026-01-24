"use server"

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Use service role for widget API (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS headers for widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

type EventType = "widget_open" | "video_start" | "video_view" | "click" | "conversion"

interface BaseEventPayload {
  project_id: string
  session_id: string
  event_type: EventType
  timestamp?: string
}

interface WidgetOpenPayload extends BaseEventPayload {
  event_type: "widget_open"
  page_url: string
  referrer?: string
  user_agent?: string
}

interface VideoStartPayload extends BaseEventPayload {
  event_type: "video_start"
  slot_id: string
}

interface VideoViewPayload extends BaseEventPayload {
  event_type: "video_view"
  slot_id: string
  watch_seconds: number
}

interface ClickPayload extends BaseEventPayload {
  event_type: "click"
  slot_id: string
  button_label: string
  button_type: string
  destination_url?: string
}

interface ConversionPayload extends BaseEventPayload {
  event_type: "conversion"
  rule_id: string
  slot_id?: string
}

type EventPayload = WidgetOpenPayload | VideoStartPayload | VideoViewPayload | ClickPayload | ConversionPayload

export async function POST(request: NextRequest) {
  try {
    const payload: EventPayload = await request.json()
    
    // Validate required fields
    if (!payload.project_id || !payload.session_id || !payload.event_type) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, session_id, event_type" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", payload.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Invalid project_id" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Upsert session (create or update last_active_at)
    const { error: sessionError } = await supabaseAdmin
      .from("sessions")
      .upsert(
        {
          id: payload.session_id,
          project_id: payload.project_id,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (sessionError) {
      console.error("Session upsert error:", sessionError)
    }

    const timestamp = payload.timestamp || new Date().toISOString()

    // Insert event based on type
    switch (payload.event_type) {
      case "widget_open": {
        const widgetPayload = payload as WidgetOpenPayload
        const { error } = await supabaseAdmin
          .from("event_widget_opens")
          .insert({
            project_id: widgetPayload.project_id,
            session_id: widgetPayload.session_id,
            page_url: widgetPayload.page_url,
            referrer: widgetPayload.referrer || null,
            user_agent: widgetPayload.user_agent || null,
            opened_at: timestamp,
          })
        
        if (error) {
          console.error("Widget open event error:", error)
          return NextResponse.json(
            { error: "Failed to record event" },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case "video_start": {
        const videoStartPayload = payload as VideoStartPayload
        if (!videoStartPayload.slot_id) {
          return NextResponse.json(
            { error: "Missing slot_id for video_start event" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const { error } = await supabaseAdmin
          .from("event_video_starts")
          .insert({
            project_id: videoStartPayload.project_id,
            session_id: videoStartPayload.session_id,
            slot_id: videoStartPayload.slot_id,
            started_at: timestamp,
          })
        
        if (error) {
          console.error("Video start event error:", error)
          return NextResponse.json(
            { error: "Failed to record event" },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case "video_view": {
        const videoViewPayload = payload as VideoViewPayload
        if (!videoViewPayload.slot_id || videoViewPayload.watch_seconds === undefined) {
          return NextResponse.json(
            { error: "Missing slot_id or watch_seconds for video_view event" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const { error } = await supabaseAdmin
          .from("event_video_views")
          .insert({
            project_id: videoViewPayload.project_id,
            session_id: videoViewPayload.session_id,
            slot_id: videoViewPayload.slot_id,
            watch_seconds: videoViewPayload.watch_seconds,
            viewed_at: timestamp,
          })
        
        if (error) {
          console.error("Video view event error:", error)
          return NextResponse.json(
            { error: "Failed to record event" },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case "click": {
        const clickPayload = payload as ClickPayload
        if (!clickPayload.slot_id || !clickPayload.button_label || !clickPayload.button_type) {
          return NextResponse.json(
            { error: "Missing required fields for click event" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const { error } = await supabaseAdmin
          .from("event_clicks")
          .insert({
            project_id: clickPayload.project_id,
            session_id: clickPayload.session_id,
            slot_id: clickPayload.slot_id,
            button_label: clickPayload.button_label,
            button_type: clickPayload.button_type,
            destination_url: clickPayload.destination_url || null,
            clicked_at: timestamp,
          })
        
        if (error) {
          console.error("Click event error:", error)
          return NextResponse.json(
            { error: "Failed to record event" },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      case "conversion": {
        const conversionPayload = payload as ConversionPayload
        if (!conversionPayload.rule_id) {
          return NextResponse.json(
            { error: "Missing rule_id for conversion event" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const { error } = await supabaseAdmin
          .from("event_conversions")
          .insert({
            project_id: conversionPayload.project_id,
            session_id: conversionPayload.session_id,
            rule_id: conversionPayload.rule_id,
            slot_id: conversionPayload.slot_id || null,
            converted_at: timestamp,
          })
        
        if (error) {
          console.error("Conversion event error:", error)
          return NextResponse.json(
            { error: "Failed to record event" },
            { status: 500, headers: corsHeaders }
          )
        }
        break
      }

      default:
        return NextResponse.json(
          { error: "Invalid event_type" },
          { status: 400, headers: corsHeaders }
        )
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Widget events API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
