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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CampaignEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'email',
    scheduleAt: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCampaign()
  }, [id])

  async function loadCampaign() {
    try {
      const res = await api.get(`/campaigns/${id}`)
      setForm({
        name: res.data.name,
        description: res.data.description || '',
        type: res.data.type || 'email',
        scheduleAt: res.data.scheduleAt || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        type: form.type,
      }
      if (form.scheduleAt) payload.scheduleAt = form.scheduleAt

      await api.patch(`/campaigns/${id}`, payload)
      router.push(`/campaigns/${id}`)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update campaign',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/campaigns/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Campaign</CardTitle>
          <CardDescription>
            Update campaign details
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
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
                <Label htmlFor="scheduleAt">Schedule At</Label>
                <Input
                  id="scheduleAt"
                  type="datetime-local"
                  value={form.scheduleAt}
                  onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })}
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/campaigns/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
