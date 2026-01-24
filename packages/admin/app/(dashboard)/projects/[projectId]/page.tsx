import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Video,
  Layers,
  Target,
  BarChart3,
  Eye,
  Play,
  MousePointer,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmbedCodeCopy } from "@/components/dashboard/embed-code-copy"

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get project details
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (error || !project) {
    notFound()
  }

  // Get counts
  const [videosResult, slotsResult, conversionsResult] = await Promise.all([
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("conversion_rules")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
  ])

  const videoCount = videosResult.count || 0
  const slotCount = slotsResult.count || 0
  const conversionCount = conversionsResult.count || 0

  // Get 30-day metrics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get sessions for this project in the last 30 days
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("project_id", projectId)
    .gte("created_at", thirtyDaysAgo.toISOString())

  const sessionIds = sessions?.map((s) => s.id) || []

  // Get widget opens
  const { count: widgetOpens } = await supabase
    .from("event_widget_opens")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Get video starts
  const { count: videoStarts } = await supabase
    .from("event_video_starts")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Get clicks
  const { count: clicks } = await supabase
    .from("event_clicks")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Generate embed script
  const embedScript = `<script src="https://widget.bonsaivideo.com/embed.js" data-project-id="${projectId}" async></script>`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">Project overview and quick stats</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href={`/projects/${projectId}/settings`}>Settings</Link>
        </Button>
      </div>

      {/* Embed Script Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Embed Script</CardTitle>
          <CardDescription>
            Add this script tag to your website to display the video widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmbedCodeCopy code={embedScript} />
        </CardContent>
      </Card>

      {/* 30-day Metrics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Last 30 Days</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Widget Opens</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(widgetOpens || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Video Plays</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(videoStarts || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Button Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(clicks || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Manage</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/projects/${projectId}/videos`}>
            <Card className="cursor-pointer transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Videos</CardTitle>
                  <CardDescription>{videoCount} videos</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href={`/projects/${projectId}/slots`}>
            <Card className="cursor-pointer transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Slots</CardTitle>
                  <CardDescription>{slotCount} slots</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href={`/projects/${projectId}/conversions`}>
            <Card className="cursor-pointer transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Conversions</CardTitle>
                  <CardDescription>{conversionCount} rules</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href={`/projects/${projectId}/analytics`}>
            <Card className="cursor-pointer transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Analytics</CardTitle>
                  <CardDescription>View detailed stats</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
