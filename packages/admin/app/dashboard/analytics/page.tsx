import { getOrgAnalytics } from '@/lib/actions/analytics'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react'
import { AnalyticsChart } from '@/components/analytics/analytics-chart'
import { AnalyticsTable } from '@/components/analytics/analytics-table'

export default async function AnalyticsPage() {
  const analytics = await getOrgAnalytics(30)

  if (!analytics) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Unable to load analytics data</p>
        </div>
      </>
    )
  }

  const stats = [
    {
      label: 'Total Sessions',
      value: analytics.totalSessions,
      icon: Users,
      description: 'Last 30 days',
    },
    {
      label: 'Conversions',
      value: analytics.convertedSessions,
      icon: Target,
      description: 'Last 30 days',
    },
    {
      label: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      description: 'Last 30 days',
    },
  ]

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
            <p className="text-muted-foreground">
              Track performance across all your projects
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sessions & Conversions</CardTitle>
              <CardDescription>Daily performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <AnalyticsChart data={analytics.chartData} />
            </CardContent>
          </Card>

          {analytics.projectPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Performance</CardTitle>
                <CardDescription>Breakdown by project</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsTable
                  columns={[
                    { key: 'name', label: 'Project' },
                    { key: 'sessions', label: 'Sessions' },
                    { key: 'conversions', label: 'Conversions' },
                    { key: 'conversionRate', label: 'Rate', format: (v) => `${v}%` },
                  ]}
                  data={analytics.projectPerformance}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
