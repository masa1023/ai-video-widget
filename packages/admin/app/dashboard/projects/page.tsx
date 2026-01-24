import Link from 'next/link'
import { getProjects } from '@/lib/actions/projects'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderKanban, ArrowRight, Calendar } from 'lucide-react'

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects' },
        ]}
        actions={
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Create your first project to start building interactive video experiences
                </p>
                <Link href="/dashboard/projects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="mt-4">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Created {formatDate(project.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
