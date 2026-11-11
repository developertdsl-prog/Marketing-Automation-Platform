'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StatCard({
  title,
  value,
  change,
  trend,
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <Badge
            variant={trend === 'up' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {change}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Contacts',
      value: '12,450',
      change: '+12%',
      trend: 'up' as const,
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2',
      trend: 'up' as const,
    },
    {
      title: 'Email Open Rate',
      value: '24.5%',
      change: '-1.2%',
      trend: 'down' as const,
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.4%',
      trend: 'up' as const,
    },
  ]

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your marketing performance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-input bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                J
              </div>
              <div>
                <p className="font-medium">John Doe subscribed to newsletter</p>
                <p className="text-xs text-muted-foreground">2 min ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                S
              </div>
              <div>
                <p className="font-medium">Summer Campaign launched</p>
                <p className="text-xs text-muted-foreground">15 min ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                A
              </div>
              <div>
                <p className="font-medium">150 new leads captured</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
