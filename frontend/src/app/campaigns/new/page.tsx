'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Clock, MailPlus, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCampaignPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'email',
    emailTemplateId: '',
    segmentId: '',
    scheduleAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const res = await api.get('/email-templates', { params: { limit: 50 } })
      setTemplates(res.data.data)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        type: form.type,
      }
      if (form.emailTemplateId) payload.emailTemplateId = form.emailTemplateId
      if (form.segmentId) payload.segmentId = form.segmentId
      if (form.scheduleAt) payload.scheduleAt = form.scheduleAt

      await api.post('/campaigns', payload)
      router.push('/campaigns')
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create campaign',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/campaigns" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to campaigns
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
          <CardDescription>
            Configure your campaign details and schedule
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Summer Sale 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Optional campaign description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Campaign Type</Label>
                <Input
                  id="type"
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduleAt">Schedule At (optional)</Label>
                <Input
                  id="scheduleAt"
                  type="datetime-local"
                  value={form.scheduleAt}
                  onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep as draft
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="emailTemplateId">Email Template</Label>
              <select
                id="emailTemplateId"
                value={form.emailTemplateId}
                onChange={(e) => setForm({ ...form, emailTemplateId: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="segmentId">Contact Segment</Label>
              <select
                id="segmentId"
                value={form.segmentId}
                onChange={(e) => setForm({ ...form, segmentId: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All contacts (no segment)</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Segments coming in a future release
              </p>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/campaigns')}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
