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
import { Bot, ArrowLeft, Mail, Tag, Users, Target, Clock, Webhook } from 'lucide-react'
import Link from 'next/link'

const TRIGGER_TYPES = [
  { key: 'contact_created', label: 'New Contact Created', icon: Users },
  { key: 'form_submission', label: 'Form Submission', icon: Mail },
  { key: 'tag_added', label: 'Tag Added', icon: Tag },
  { key: 'lead_status_changed', label: 'Lead Status Changed', icon: Target },
  { key: 'campaign_event', label: 'Campaign Event', icon: Mail },
]

const ACTION_TYPES = [
  { key: 'send_email', label: 'Send Email', icon: Mail },
  { key: 'add_tag', label: 'Add Tag', icon: Tag },
  { key: 'update_contact', label: 'Update Contact', icon: Users },
  { key: 'assign_lead', label: 'Assign Lead', icon: Target },
  { key: 'wait', label: 'Wait / Delay', icon: Clock },
  { key: 'webhook', label: 'Trigger Webhook', icon: Webhook },
  { key: 'update_lead_status', label: 'Update Lead Status', icon: Target },
]

export default function NewWorkflowPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerType: '',
    triggerConfig: {},
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        nodeType: 'contact_created',
        config: {},
        positionX: 100,
        positionY: 100,
      },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState<string>('')
  const [triggerTypes, setTriggerTypes] = useState<any[]>(TRIGGER_TYPES)
  const [actionTypes, setActionTypes] = useState<any[]>(ACTION_TYPES)

  useEffect(() => {
    loadTriggerTypes()
  }, [])

  async function loadTriggerTypes() {
    try {
      const res = await api.get('/workflows/triggers')
      setTriggerTypes(res.data || TRIGGER_TYPES)
    } catch {
      // use defaults
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        name: form.name,
        description: form.description,
        triggerType: form.triggerType,
        triggerConfig: form.triggerConfig,
        nodes: form.nodes,
        isActive: false,
        createdById: 'temp-user-id', // TODO: Get from auth store
      }
      await api.post('/workflows', payload)
      router.push('/workflows')
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create workflow',
      )
    } finally {
      setLoading(false)
    }
  }

  const addNode = (nodeType: string) => {
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: 'action',
      nodeType,
      config: {},
      positionX: 300 + Math.random() * 200,
      positionY: 100 + Math.random() * 200,
    }
    setForm({ ...form, nodes: [...form.nodes, newNode] })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/workflows" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to workflows
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Workflow config */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>
                Configure basic workflow details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Welcome Series"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="What this workflow does"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trigger</CardTitle>
              <CardDescription>
                What starts this workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Trigger Type</Label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a trigger</option>
                  {triggerTypes.map((t: any) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Trigger Configuration</Label>
                <div className="flex gap-2">
                  {triggerTypes.map((t: any) => (
                    <Button
                      key={t.key}
                      variant={selectedTrigger === t.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTrigger(t.key)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Visual builder */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow Builder</CardTitle>
                  <CardDescription>
                    Drag nodes to build your automation
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {actionTypes.map((a: any) => (
                    <Button
                      key={a.key}
                      size="sm"
                      onClick={() => addNode(a.key)}
                      className="flex items-center gap-2"
                    >
                      <a.icon className="h-3 w-3" />
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-gray-50 rounded-lg min-h-[400px]">
              {form.nodes.map((node: any) => (
                <div
                  key={node.id}
                  className="absolute rounded-lg border border-input bg-card p-4 shadow-sm"
                  style={{
                    left: node.positionX,
                    top: node.positionY,
                    width: 200,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary">
                      {node.nodeType.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        node.type === 'trigger'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {node.type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {JSON.stringify(node.config).slice(0, 50)}...
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {}}>
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setForm({
                          ...form,
                          nodes: form.nodes.filter((n: any) => n.id !== node.id),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center text-muted-foreground text-sm mt-8">
                No workflow nodes yet. Add actions from the right panel.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/workflows')}>
          Cancel
        </Button>
        <Button type="submit" className="w-auto" disabled={loading}>
          {loading ? 'Creating...' : 'Create Workflow'}
        </Button>
      </div>
    </div>
  )
}
