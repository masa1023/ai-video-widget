"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Eye,
  Play,
  MousePointer,
  Target,
  TrendingUp,
  Video,
  BarChart3,
} from "lucide-react"

interface SlotType {
  id: string
  project_id: string
  video_id: string
  name: string
  is_entry_point: boolean
  button_type: "cta" | "detail" | "transition"
  button_label: string
  button_url: string | null
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

interface VideoType {
  id: string
  project_id: string
  title: string
  storage_path: string
  thumbnail_path: string | null
  duration_ms: number
  created_at: string
  updated_at: string
}

interface AnalyticsData {
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
    starts: number
    views: number
    viewRate: number
    clicks: number
  }[]
  clickBreakdown: {
    buttonType: string
    count: number
  }[]
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [period, setPeriod] = useState("30")
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [slots, setSlots] = useState<SlotType[]>([])
  const [videos, setVideos] = useState<VideoType[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Get slots and videos for mapping
    const [slotsResult, videosResult] = await Promise.all([
      supabase.from("slots").select("*").eq("project_id", projectId),
      supabase.from("videos").select("*").eq("project_id", projectId),
    ])

    setSlots(slotsResult.data || [])
    setVideos(videosResult.data || [])

    // Calculate date range
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get sessions for this project in the period
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("project_id", projectId)
      .gte("created_at", daysAgo.toISOString())

    const sessionIds = sessions?.map((s) => s.id) || []
    const safeSessionIds = sessionIds.length > 0 ? sessionIds : ["none"]

    // Get all event counts
    const [
      widgetOpensResult,
      videoStartsResult,
      videoViewsResult,
      clicksResult,
      conversionsResult,
      clicksByTypeResult,
    ] = await Promise.all([
      supabase
        .from("event_widget_opens")
        .select("id", { count: "exact", head: true })
        .in("session_id", safeSessionIds),
      supabase
        .from("event_video_starts")
        .select("id, slot_id", { count: "exact" })
        .in("session_id", safeSessionIds),
      supabase
        .from("event_video_views")
        .select("id, slot_id", { count: "exact" })
        .in("session_id", safeSessionIds),
      supabase
        .from("event_clicks")
        .select("id, slot_id, button_type", { count: "exact" })
        .in("session_id", safeSessionIds),
      supabase
        .from("event_conversions")
        .select("id", { count: "exact", head: true })
        .in("session_id", safeSessionIds),
      supabase
        .from("event_clicks")
        .select("button_type")
        .in("session_id", safeSessionIds),
    ])

    const widgetOpens = widgetOpensResult.count || 0
    const videoStarts = videoStartsResult.count || 0
    const videoViews = videoViewsResult.count || 0
    const clicks = clicksResult.count || 0
    const conversions = conversionsResult.count || 0
    const conversionRate = widgetOpens > 0 ? (conversions / widgetOpens) * 100 : 0

    // Calculate slot stats
    const slotStats = (slotsResult.data || []).map((slot) => {
      const video = (videosResult.data || []).find(
        (v) => v.id === slot.video_id
      )
      const starts =
        videoStartsResult.data?.filter((e) => e.slot_id === slot.id).length || 0
      const views =
        videoViewsResult.data?.filter((e) => e.slot_id === slot.id).length || 0
      const slotClicks =
        clicksResult.data?.filter((e) => e.slot_id === slot.id).length || 0

      return {
        slotId: slot.id,
        slotName: slot.name,
        videoTitle: video?.title || "Unknown",
        starts,
        views,
        viewRate: starts > 0 ? (views / starts) * 100 : 0,
        clicks: slotClicks,
      }
    })

    // Calculate click breakdown
    const clickCounts: Record<string, number> = {}
    clicksByTypeResult.data?.forEach((click) => {
      const type = click.button_type
      clickCounts[type] = (clickCounts[type] || 0) + 1
    })

    const clickBreakdown = Object.entries(clickCounts).map(([type, count]) => ({
      buttonType: type,
      count,
    }))

    setData({
      widgetOpens,
      videoStarts,
      videoViews,
      clicks,
      conversions,
      conversionRate,
      slotStats,
      clickBreakdown,
    })

    setIsLoading(false)
  }, [projectId, period, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatButtonType = (type: string) => {
    switch (type) {
      case "cta":
        return "CTA Links"
      case "detail":
        return "Details"
      case "transition":
        return "Transitions"
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track widget performance and user engagement
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Widget Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.widgetOpens || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total widget impressions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Video Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.videoStarts || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Videos started playing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Button Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.clicks || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total button clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.conversions || 0} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Video Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Performance
            </CardTitle>
            <CardDescription>
              Engagement metrics for each video slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.slotStats && data.slotStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead className="text-right">Plays</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slotStats.map((stat) => (
                    <TableRow key={stat.slotId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stat.slotName}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.videoTitle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{stat.starts}</TableCell>
                      <TableCell className="text-right">{stat.views}</TableCell>
                      <TableCell className="text-right">
                        {stat.viewRate.toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Video className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No video data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Click Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Click Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of click types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.clickBreakdown && data.clickBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.clickBreakdown.map((item) => {
                  const total = data.clicks || 1
                  const percentage = (item.count / total) * 100
                  return (
                    <div key={item.buttonType} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatButtonType(item.buttonType)}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MousePointer className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No click data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
