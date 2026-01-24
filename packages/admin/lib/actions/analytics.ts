'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjectAnalytics(projectId: string, days: number = 30) {
  const supabase = await createClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  // Get session stats
  const { data: sessions, error: sessionsError } = await supabase
    .from('widget_sessions')
    .select('id, started_at, ended_at, converted, device_type')
    .eq('project_id', projectId)
    .gte('started_at', startDateStr)

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError)
  }

  const sessionList = sessions || []
  const totalSessions = sessionList.length
  const convertedSessions = sessionList.filter(s => s.converted).length
  const conversionRate = totalSessions > 0 ? (convertedSessions / totalSessions) * 100 : 0

  // Device breakdown
  const deviceBreakdown = sessionList.reduce((acc, s) => {
    const device = s.device_type || 'unknown'
    acc[device] = (acc[device] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Daily sessions for chart
  const dailyData: Record<string, { sessions: number; conversions: number }> = {}
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dailyData[dateStr] = { sessions: 0, conversions: 0 }
  }

  sessionList.forEach(s => {
    const dateStr = new Date(s.started_at).toISOString().split('T')[0]
    if (dailyData[dateStr]) {
      dailyData[dateStr].sessions++
      if (s.converted) {
        dailyData[dateStr].conversions++
      }
    }
  })

  const chartData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      sessions: data.sessions,
      conversions: data.conversions,
    }))

  // Get slot view stats
  const { data: slotViews, error: slotViewsError } = await supabase
    .from('event_slot_views')
    .select('slot_id, watch_duration_sec, slots(name)')
    .in('session_id', sessionList.map(s => s.id))

  if (slotViewsError && sessionList.length > 0) {
    console.error('Error fetching slot views:', slotViewsError)
  }

  const slotStats = (slotViews || []).reduce((acc, sv) => {
    const slotName = (sv.slots as { name: string } | null)?.name || 'Unknown'
    if (!acc[slotName]) {
      acc[slotName] = { views: 0, totalDuration: 0 }
    }
    acc[slotName].views++
    acc[slotName].totalDuration += sv.watch_duration_sec || 0
    return acc
  }, {} as Record<string, { views: number; totalDuration: number }>)

  const slotPerformance = Object.entries(slotStats).map(([name, stats]) => ({
    name,
    views: stats.views,
    avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
  }))

  // Get conversion rule performance
  const { data: conversionEvents, error: convEventsError } = await supabase
    .from('event_conversions')
    .select('rule_id, conversion_rules(name)')
    .in('session_id', sessionList.map(s => s.id))

  if (convEventsError && sessionList.length > 0) {
    console.error('Error fetching conversion events:', convEventsError)
  }

  const ruleStats = (conversionEvents || []).reduce((acc, ce) => {
    const ruleName = (ce.conversion_rules as { name: string } | null)?.name || 'Unknown'
    acc[ruleName] = (acc[ruleName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const rulePerformance = Object.entries(ruleStats).map(([name, count]) => ({
    name,
    conversions: count,
  }))

  return {
    totalSessions,
    convertedSessions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    deviceBreakdown,
    chartData,
    slotPerformance,
    rulePerformance,
  }
}

export async function getOrgAnalytics(days: number = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  const { data: sessions } = await supabase
    .from('widget_sessions')
    .select('id, project_id, started_at, converted, projects(name)')
    .eq('organization_id', profile.organization_id)
    .gte('started_at', startDateStr)

  const sessionList = sessions || []
  const totalSessions = sessionList.length
  const convertedSessions = sessionList.filter(s => s.converted).length
  const conversionRate = totalSessions > 0 ? (convertedSessions / totalSessions) * 100 : 0

  // Per project breakdown
  const projectStats = sessionList.reduce((acc, s) => {
    const projectName = (s.projects as { name: string } | null)?.name || 'Unknown'
    if (!acc[projectName]) {
      acc[projectName] = { sessions: 0, conversions: 0 }
    }
    acc[projectName].sessions++
    if (s.converted) acc[projectName].conversions++
    return acc
  }, {} as Record<string, { sessions: number; conversions: number }>)

  const projectPerformance = Object.entries(projectStats).map(([name, stats]) => ({
    name,
    sessions: stats.sessions,
    conversions: stats.conversions,
    conversionRate: stats.sessions > 0 
      ? Math.round((stats.conversions / stats.sessions) * 10000) / 100 
      : 0,
  }))

  // Daily data
  const dailyData: Record<string, { sessions: number; conversions: number }> = {}
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dailyData[dateStr] = { sessions: 0, conversions: 0 }
  }

  sessionList.forEach(s => {
    const dateStr = new Date(s.started_at).toISOString().split('T')[0]
    if (dailyData[dateStr]) {
      dailyData[dateStr].sessions++
      if (s.converted) dailyData[dateStr].conversions++
    }
  })

  const chartData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      sessions: data.sessions,
      conversions: data.conversions,
    }))

  return {
    totalSessions,
    convertedSessions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    projectPerformance,
    chartData,
  }
}
