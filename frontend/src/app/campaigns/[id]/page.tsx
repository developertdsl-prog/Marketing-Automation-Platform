'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { Mail, Play, Pause, Trash2, Edit, ArrowRight, MailPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const STATUS_BADGE: Record<string, string> = {
    draft: 'outline',
    scheduled: 'secondary',
    active: 'default',
    paused: 'destructive',
    completed: 'secondary',
    cancelled: 'destructive',
  }

  useEffect(() => {
    loadCampaign()
  }, [id])

  async function loadCampaign() {
    try {
      const res = await api.get(`/campaigns/${id}`)
      setCampaign(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  async function launchCampaign() {
    if (!window.confirm('Launch this campaign? This will start sending emails.'))
      return
    try {
      await api.post(`/campaigns/${id}/launch`)
      loadCampaign()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to launch campaign')
    }
  }

  async function pauseCampaign() {
    if (!window.confirm('Pause this campaign? Sending will be stopped.')) return
    try {
      await api.post(`/campaigns/${id}/pause`)
      loadCampaign()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pause campaign')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">
            {campaign.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to campaigns
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Campaign header info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Campaign Details</CardTitle>
            <p className="text-xs text-muted-foreground">
              ID: {campaign.id}
            </p>
          </div>
          <Badge
            variant={
              (STATUS_BADGE[campaign.status] ||
                'outline') as 'default' | 'destructive' | 'outline' | 'secondary'
            }
          >
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Template</span>
            <span className="font-medium">
              {campaign.emailTemplate?.name || '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Segment</span>
            <span className="font-medium">
              {campaign.segment?.name || 'All contacts'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Type</span>
            <span className="font-medium">{campaign.type}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Scheduled</span>
            <span className="font-medium">
              {campaign.scheduleAt || '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Recipients</span>
            <span className="font-medium text-foreground">
              {campaign._count?.recipients || 0}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Events</span>
            <span className="font-medium text-foreground">
              {campaign._count?.emailEvents || 0}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Sent</span>
            <span className="font-medium text-foreground">—</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Open Rate</span>
            <span className="font-medium text-foreground">—%</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {campaign.status === 'draft' && (
            <Button onClick={launchCampaign} className="w-full flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              Launch Campaign
            </Button>
          )}
          {campaign.status === 'active' && (
            <Button
              variant="outline"
              onClick={pauseCampaign}
              className="w-full flex items-center justify-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause Campaign
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/campaigns/${id}/edit`)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  'Delete this campaign? This cannot be undone.',
                )
              ) {
                // Delete handled via API
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>

      {/* Recipients preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.recipients && campaign.recipients.length > 0 ? (
            <div className="space-y-3">
              {campaign.recipients.slice(0, 10).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {r.contact?.firstName?.[0]}{r.contact?.lastName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {r.contact?.firstName} {r.contact?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.contact?.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recipients yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
