'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  Play,
  MousePointer,
  Target,
  Video as VideoIcon,
  BarChart3,
  Layers,
} from 'lucide-react'
import type { Slot, Video, AnalyticsData } from '@/lib/types'

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [period, setPeriod] = useState('30')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get slots and videos for mapping
    const [slotsResult, videosResult] = await Promise.all([
      supabase.from('slots').select('*').eq('project_id', projectId),
      supabase.from('videos').select('*').eq('project_id', projectId),
    ])

    // Calculate date range
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))
    const sinceDate = daysAgo.toISOString()

    // Get all event counts filtered by project_id directly
    const [
      widgetOpensResult,
      videoStartsResult,
      videoViewsResult,
      clicksResult,
      conversionsResult,
      clicksByTypeResult,
    ] = await Promise.all([
      supabase
        .from('event_widget_opens')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
      supabase
        .from('event_video_starts')
        .select('id, slot_id', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
      supabase
        .from('event_video_views')
        .select('id, slot_id', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
      supabase
        .from('event_clicks')
        .select('id, slot_id, click_type', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
      supabase
        .from('event_conversions')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
      supabase
        .from('event_clicks')
        .select('click_type, slot_id')
        .eq('project_id', projectId)
        .gte('created_at', sinceDate),
    ])

    const widgetOpens = widgetOpensResult.count || 0
    const videoStarts = videoStartsResult.count || 0
    const videoViews = videoViewsResult.count || 0
    const clicks = clicksResult.count || 0
    const conversions = conversionsResult.count || 0
    const conversionRate =
      widgetOpens > 0 ? (conversions / widgetOpens) * 100 : 0

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
        slotName: slot.title || 'Untitled',
        videoTitle: video?.title || 'Unknown',
        starts,
        views,
        viewRate: starts > 0 ? (views / starts) * 100 : 0,
        clicks: slotClicks,
      }
    })

    // Calculate click breakdown
    const clickCounts: Record<string, number> = {}
    clicksByTypeResult.data?.forEach((click) => {
      const type = click.click_type
      clickCounts[type] = (clickCounts[type] || 0) + 1
    })

    const clickBreakdown = Object.entries(clickCounts).map(([type, count]) => ({
      buttonType: type,
      count,
    }))

    // Click by slot
    const slotClickMap: Record<
      string,
      { cta: number; detail: number; nextVideo: number }
    > = {}
    clicksByTypeResult.data?.forEach((click) => {
      const sid = click.slot_id || '(unknown)'
      if (!slotClickMap[sid]) {
        slotClickMap[sid] = { cta: 0, detail: 0, nextVideo: 0 }
      }
      if (click.click_type === 'cta') slotClickMap[sid].cta++
      else if (click.click_type === 'detail') slotClickMap[sid].detail++
      else if (click.click_type === 'next_video') slotClickMap[sid].nextVideo++
    })
    const clickBySlot = Object.entries(slotClickMap)
      .map(([sid, counts]) => {
        const slot = (slotsResult.data || []).find((s) => s.id === sid)
        return {
          slotId: sid,
          slotName: slot?.title || 'Unknown',
          ...counts,
          total: counts.cta + counts.detail + counts.nextVideo,
        }
      })
      .sort((a, b) => b.total - a.total)

    setData({
      widgetOpens,
      videoStarts,
      videoViews,
      clicks,
      conversions,
      conversionRate,
      slotStats,
      clickBreakdown,
      clickBySlot,
    })

    setIsLoading(false)
  }, [projectId, period, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatButtonType = (type: string) => {
    switch (type) {
      case 'cta':
        return 'CTA Links'
      case 'detail':
        return 'Details'
      case 'next_video':
        return 'Next Video'
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
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
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
              <VideoIcon className="h-5 w-5" />
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
                      <TableCell className="text-right">
                        {stat.starts}
                      </TableCell>
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
                <VideoIcon className="h-8 w-8 text-muted-foreground" />
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
            <CardDescription>Distribution of click types</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Clicks by Slot
            </CardTitle>
            <CardDescription>Click type breakdown per slot</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.clickBySlot && data.clickBySlot.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead className="text-right">CTA</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                    <TableHead className="text-right">Next</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clickBySlot.map((item) => (
                    <TableRow key={item.slotId}>
                      <TableCell className="font-medium">
                        {item.slotName}
                      </TableCell>
                      <TableCell className="text-right">{item.cta}</TableCell>
                      <TableCell className="text-right">
                        {item.detail}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.nextVideo}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="h-8 w-8 text-muted-foreground" />
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
