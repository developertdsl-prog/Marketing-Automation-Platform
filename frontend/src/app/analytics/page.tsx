'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Cell as PieCell,
  Label,
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface DashboardStats {
  totalContacts: number
  totalLeads: number
  activeCampaigns: number
  totalCampaigns: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: string
  clickRate: string
  recentContacts: any[]
  recentLeads: any[]
  recentCampaigns: any[]
}

interface ContactGrowthPoint {
  date: string
  contacts: number
}

interface CampaignPerformance {
  id: string
  name: string
  status: string
  totalRecipients: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: string
  clickRate: string
}

interface EmailPerformance {
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  openRate: string
  clickRate: string
  bounceRate: string
  eventsByType: Record<string, number>
}

interface LeadAnalytics {
  totalLeads: number
  byStatus: Record<string, number>
  averageScore: string
}

interface ConversionMetrics {
  totalLeads: number
  convertedLeads: number
  conversionRate: string
  totalConvertedValue: string
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [contactGrowth, setContactGrowth] = useState<ContactGrowthPoint[]>([])
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([])
  const [emailPerformance, setEmailPerformance] = useState<EmailPerformance | null>(null)
  const [leadAnalytics, setLeadAnalytics] = useState<LeadAnalytics | null>(null)
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null)
  const [topCampaigns, setTopCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAllAnalytics()
  }, [])

  async function loadAllAnalytics() {
    try {
      const [dashResp, growthResp, campaignResp, emailResp, leadResp, conversionResp, topResp] =
        await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/contact-growth', { params: { days: 30 } }),
          api.get('/analytics/campaign-performance', { params: { limit: 10 } }),
          api.get('/analytics/email-performance'),
          api.get('/analytics/lead-analytics'),
          api.get('/analytics/conversion-metrics'),
          api.get('/analytics/top-campaigns', { params: { limit: 5 } }),
        ])

      setDashboard(dashResp.data)
      setContactGrowth(growthResp.data)
      setCampaignPerformance(campaignResp.data)
      setEmailPerformance(emailResp.data)
      setLeadAnalytics(leadResp.data)
      setConversionMetrics(conversionResp.data)
      setTopCampaigns(topResp.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Track performance, engagement, and conversion metrics
          </p>
        </div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          View all reports →
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={dashboard.totalContacts.toLocaleString()}
          trend="up"
          change="+12%"
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Leads"
          value={dashboard.totalLeads.toLocaleString()}
          trend="up"
          change="+8%"
          iconClass="bg-green-50 text-green-600"
        />
        <StatCard
          title="Active Campaigns"
          value={dashboard.activeCampaigns}
          trend="neutral"
          change="0"
          iconClass="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Email Open Rate"
          value={dashboard.openRate}
          trend="up"
          change="+2.1%"
          iconClass="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Growth (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contactGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="contacts" stroke="#3b82f6" fill="#3b82f6" opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Email Performance Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email Events Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sent', value: emailPerformance?.totalSent || 0 },
                      { name: 'Opened', value: emailPerformance?.totalOpened || 0 },
                      { name: 'Clicked', value: emailPerformance?.totalClicked || 0 },
                      { name: 'Bounced', value: emailPerformance?.totalBounced || 0 },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    labelLine={false}

                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(leadAnalytics?.byStatus || {}).map(([status, count]) => ({ status, count }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Campaign Performance Table + Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Campaign Performance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
              <Link href="/campaigns" className="text-xs text-primary hover:underline">
                View all campaigns
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Campaign</th>
                    <th className="pb-2 font-medium text-right">Sent</th>
                    <th className="pb-2 font-medium text-right">Opened</th>
                    <th className="pb-2 font-medium text-right">Clicked</th>
                    <th className="pb-2 font-medium text-right">Open Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerformance.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-accent/50">
                      <td className="py-3 font-medium text-foreground truncate max-w-[200px]">
                        {c.name}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{c.totalSent}</td>
                      <td className="py-3 text-right text-muted-foreground">{c.totalOpened}</td>
                      <td className="py-3 text-right text-muted-foreground">{c.totalClicked}</td>
                      <td className="py-3 text-right">
                        <Badge variant={parseFloat(c.openRate) > 20 ? 'default' : 'outline'}>
                          {c.openRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {campaignPerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No campaign data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Total Leads</span>
              <span className="text-sm font-medium">{conversionMetrics?.totalLeads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Converted Leads</span>
              <span className="text-sm font-medium">{conversionMetrics?.convertedLeads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="text-sm font-medium text-primary">
                {conversionMetrics?.conversionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Converted Value</span>
              <span className="text-sm font-medium">
                ${conversionMetrics?.totalConvertedValue}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCampaigns.length > 0 ? (
              topCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.totalSent} sent • {c.totalOpened} opened
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {c.openRate}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No campaigns with sends yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                {dashboard.recentContacts[0]?.firstName?.[0]}{dashboard.recentContacts[0]?.lastName?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {dashboard.recentContacts[0]?.firstName} {dashboard.recentContacts[0]?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.recentContacts[0]?.email}
                </p>
              </div>
            </div>
            <Badge variant="default">New Contact</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {dashboard.recentCampaigns[0]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Campaign {dashboard.recentCampaigns[0]?.status}
                </p>
              </div>
            </div>
            <Badge variant="outline">{dashboard.recentCampaigns[0]?.status}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="19" r="1"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Lead converted
                </p>
                <p className="text-xs text-muted-foreground">
                  ${dashboard.recentLeads[0]?.value || 0} value
                </p>
              </div>
            </div>
            <Badge variant="default">Converted</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  trend,
  iconClass,
}: {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  iconClass: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={iconClass}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4"/><path d="M13 18V6"/><path d="M6 12H2"/></svg>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <Badge
            variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {change}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
