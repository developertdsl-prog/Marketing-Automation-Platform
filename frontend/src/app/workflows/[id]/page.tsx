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
import { Bot, Play, Pause, Trash2, Edit, ArrowRight, ArrowLeft, Clock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [workflow, setWorkflow] = useState<any>(null)
  const [executions, setExecutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const STATUS_BADGE: Record<string, string> = {
    draft: 'outline',
    active: 'default',
    paused: 'destructive',
    completed: 'secondary',
  }

  useEffect(() => {
    loadWorkflow()
    loadExecutions()
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

  async function loadExecutions() {
    try {
      const res = await api.get(`/workflows/${id}/executions`, {
        params: { page: 1, limit: 20 },
      })
      setExecutions(res.data.data)
    } catch {
      // ignore
    }
  }

  async function activateWorkflow() {
    try {
      await api.post(`/workflows/${id}/activate`)
      loadWorkflow()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate workflow')
    }
  }

  async function deactivateWorkflow() {
    try {
      await api.post(`/workflows/${id}/deactivate`)
      loadWorkflow()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate workflow')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Workflow not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{workflow.name}</h1>
          <p className="text-muted-foreground">
            {workflow.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/workflows" className="text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to workflows
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Workflow info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Workflow Details</CardTitle>
            <p className="text-xs text-muted-foreground">
              ID: {workflow.id}
            </p>
          </div>
          <Badge
            variant={
              (STATUS_BADGE[workflow.status] ||
                'outline') as 'default' | 'destructive' | 'outline' | 'secondary'
            }
          >
            {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Trigger</span>
            <span className="font-medium">
              {workflow.triggerType.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <span className="font-medium">
              {workflow.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Nodes</span>
            <span className="font-medium">
              {workflow.nodes?.length || 0}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Executions</span>
            <span className="font-medium">
              {workflow._count?.executions || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {!workflow.isActive && (
            <Button onClick={activateWorkflow} className="w-full flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              Activate Workflow
            </Button>
          )}
          {workflow.isActive && (
            <Button
              variant="outline"
              onClick={deactivateWorkflow}
              className="w-full flex items-center justify-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Deactivate Workflow
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/workflows/${id}/edit`)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Workflow
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  'Delete this workflow? This cannot be undone.',
                )
              ) {
                // Delete via API
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>

      {/* Nodes preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Workflow Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.nodes && workflow.nodes.length > 0 ? (
            <div className="space-y-3">
              {workflow.nodes.map((node: any) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-xs">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {node.nodeType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {node.type}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Order {node.order + 1}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No nodes defined
            </p>
          )}
        </CardContent>
      </Card>

      {/* Execution history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Execution History</CardTitle>
            <Badge variant="outline">
              {executions.length} recent
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {e.contactId ? 'C' : 'W'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Execution #{e.id.slice(-6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      e.status === 'completed'
                        ? 'default'
                        : e.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                    }
                    className="text-xs"
                  >
                    {e.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No executions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
