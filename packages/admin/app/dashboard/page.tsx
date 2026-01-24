import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/utils/get-profile'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FolderKanban, Video, GitBranch, BarChart3, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const [projectsResult, videosResult, slotsResult, sessionsResult] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact' }).eq('organization_id', profile.organization_id),
    supabase.from('videos').select('id', { count: 'exact' }).eq('organization_id', profile.organization_id),
    supabase.from('slots').select('id', { count: 'exact' }).eq('organization_id', profile.organization_id),
    supabase.from('widget_sessions').select('id', { count: 'exact' }).eq('organization_id', profile.organization_id),
  ])

  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const stats = [
    { label: 'Projects', value: projectsResult.count || 0, icon: FolderKanban, href: '/dashboard/projects' },
    { label: 'Videos', value: videosResult.count || 0, icon: Video, href: '/dashboard/videos' },
    { label: 'Slots', value: slotsResult.count || 0, icon: GitBranch, href: '/dashboard/slots' },
    { label: 'Sessions', value: sessionsResult.count || 0, icon: BarChart3, href: '/dashboard/analytics' },
  ]

  const greeting = getGreeting()

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: 'Dashboard' }]} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {greeting}, {profile?.display_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your interactive videos
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your most recently updated projects</CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentProjects && recentProjects.length > 0 ? (
                  <div className="space-y-3">
                    {recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Updated {formatRelativeTime(project.updated_at)}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No projects yet</p>
                    <Link href="/dashboard/projects/new">
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        Create your first project
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to get you started</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href="/dashboard/projects/new">
                  <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create New Project</p>
                      <p className="text-xs text-muted-foreground">Start a new interactive video project</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/dashboard/videos">
                  <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Upload Video</p>
                      <p className="text-xs text-muted-foreground">Add new video content to your library</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Check your video performance metrics</p>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}
