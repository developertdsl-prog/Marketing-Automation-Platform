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
import { Bot, ArrowLeft, Mail, Tag, Users, Target, Clock, Webhook } from 'lucide-react'
import Link from 'next/link'

const ACTION_TYPES = [
  { key: 'send_email', label: 'Send Email', icon: Mail },
  { key: 'add_tag', label: 'Add Tag', icon: Tag },
  { key: 'update_contact', label: 'Update Contact', icon: Users },
  { key: 'assign_lead', label: 'Assign Lead', icon: Target },
  { key: 'wait', label: 'Wait / Delay', icon: Clock },
  { key: 'webhook', label: 'Trigger Webhook', icon: Webhook },
  { key: 'update_lead_status', label: 'Update Lead Status', icon: Target },
]

export default function WorkflowEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWorkflow()
  }, [id])

  async function loadWorkflow() {
    try {
      const res = await api.get(`/workflows/${id}`)
      setWorkflow(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        triggerType: workflow.triggerType,
        triggerConfig: workflow.triggerConfig,
        nodes: workflow.nodes,
        isActive: workflow.isActive,
      }
      await api.patch(`/workflows/${id}`, payload)
      router.push(`/workflows/${id}`)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update workflow',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href={`/workflows/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to workflow
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Workflow</CardTitle>
          <CardDescription>
            Update workflow settings and nodes
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
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                type="text"
                value={workflow.name}
                onChange={(e) =>
                  setWorkflow({ ...workflow, name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={workflow.description || ''}
                onChange={(e) =>
                  setWorkflow({ ...workflow, description: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Input
                id="triggerType"
                type="text"
                value={workflow.triggerType}
                onChange={(e) =>
                  setWorkflow({ ...workflow, triggerType: e.target.value })
                }
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/workflows/${id}`)}>
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
