'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartData = {
  date: string
  sessions: number
  conversions: number
}

export function AnalyticsChart({ data }: { data: ChartData[] }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-popover border rounded-lg shadow-lg p-3">
                <p className="text-sm font-medium mb-2">{formatDate(label)}</p>
                {payload.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground capitalize">{entry.name}:</span>
                    <span className="font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="sessions"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSessions)"
        />
        <Area
          type="monotone"
          dataKey="conversions"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorConversions)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
