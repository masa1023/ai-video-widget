import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProject, getProjectStats } from '@/lib/actions/projects'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video, GitBranch, Target, BarChart3, Settings, Play } from 'lucide-react'
import { ProjectVideos } from '@/components/project/project-videos'
import { ProjectSlots } from '@/components/project/project-slots'
import { ProjectConversions } from '@/components/project/project-conversions'
import { ProjectSettings } from '@/components/project/project-settings'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  const stats = await getProjectStats(id)

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('widget_key')
    .eq('id', project.organization_id)
    .single()

  const statCards = [
    { label: 'Videos', value: stats.videoCount, icon: Video },
    { label: 'Slots', value: stats.slotCount, icon: GitBranch },
    { label: 'Sessions', value: stats.sessionCount, icon: BarChart3 },
  ]

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/dashboard/projects' },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/preview/${project.id}?key=${org?.widget_key}`} target="_blank">
              <Button variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </Link>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="videos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="slots" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Slots
              </TabsTrigger>
              <TabsTrigger value="conversions" className="gap-2">
                <Target className="h-4 w-4" />
                Conversions
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="videos">
              <ProjectVideos projectId={project.id} />
            </TabsContent>
            <TabsContent value="slots">
              <ProjectSlots projectId={project.id} />
            </TabsContent>
            <TabsContent value="conversions">
              <ProjectConversions projectId={project.id} />
            </TabsContent>
            <TabsContent value="settings">
              <ProjectSettings project={project} widgetKey={org?.widget_key || ''} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
