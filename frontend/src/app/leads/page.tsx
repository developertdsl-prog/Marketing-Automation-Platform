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
import { Plus, Search, Target, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'

const STATUS_BADGE: Record<string, string> = {
  new: 'outline',
  contacted: 'default',
  qualified: 'default',
  converted: 'default',
  lost: 'destructive',
}

export default function LeadsPage() {
  const { user } = useAuthStore()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadLeads()
  }, [search, statusFilter, user?.organization?.id])

  async function loadLeads() {
    try {
      const res = await api.get('/leads', {
        params: {
          search,
          status: statusFilter || undefined,
          page: 1,
          limit: 50,
        },
      })
      setLeads(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leads')
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

  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost']

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Track and manage your sales leads
          </p>
        </div>
        <Link href="/leads/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Lead
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
                  placeholder="Search leads..."
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
                {leads.length} total leads
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead className="text-center">Contact</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Source</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="w-1/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {lead.contact?.firstName?.[0]}{lead.contact?.lastName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {lead.contact?.firstName} {lead.contact?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.contact?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-1/6 text-center">
                      {lead.team?.name || <span className="text-xs text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell className="w-1/6 text-center">
                      <Badge
                        variant={
                          (STATUS_BADGE[lead.status] ||
                            'outline') as 'default' | 'destructive' | 'outline' | 'secondary'
                        }
                      >
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-1/12 text-right">
                      <span className="font-medium">{lead.score}</span>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <span className="text-muted-foreground text-sm">
                        {lead.source || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/12 text-right">
                      <span className="font-medium">
                        ${lead.value?.toLocaleString() || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads found
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
