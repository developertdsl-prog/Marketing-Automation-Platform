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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Mail, Clock, Play, Pause, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  draft: 'outline',
  scheduled: 'secondary',
  active: 'default',
  paused: 'destructive',
  completed: 'secondary',
  cancelled: 'destructive',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCampaigns()
  }, [search, statusFilter])

  async function loadCampaigns() {
    try {
      const res = await api.get('/campaigns', {
        params: { search, status: statusFilter || undefined, page: 1, limit: 50 },
      })
      setCampaigns(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaigns')
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

  const statuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your marketing campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border border-input">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 p-6">
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {campaigns.length} total campaigns
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-center">Template</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="w-1/4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-medium">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-1/6 text-center">
                      <span className="text-muted-foreground text-sm">
                        {campaign.emailTemplate?.name || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-center">
                      <Badge
                        variant={
                          (STATUS_BADGE[campaign.status] ||
                            'outline') as 'default' | 'destructive' | 'outline' | 'secondary'
                        }
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-1/8 text-right">
                      <span className="font-medium">
                        {campaign._count?.recipients || 0}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/8 text-right">
                      <span className="font-medium">
                        {campaign._count?.emailEvents || 0}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Launch this campaign? This will start sending emails.',
                                )
                              ) {
                                // Launch handled via detail page
                              }
                            }}
                          >
                            Launch
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Pause this campaign? Sending will be stopped.',
                                )
                              ) {
                                // Pause handled via detail page
                              }
                            }}
                          >
                            Pause
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
