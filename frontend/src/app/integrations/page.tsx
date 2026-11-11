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
import { Plus, Search, Mail, Slack, Settings, Play, Trash2, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const PROVIDER_ICONS: Record<string, any> = {
  sendgrid: Mail,
  mailgun: Mail,
  aws_ses: ShieldCheck,
  smtp: Settings,
  slack: Slack,
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    provider: '',
    name: '',
    apiKey: '',
    domain: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
    host: '',
    port: '587',
    user: '',
    password: '',
    from: '',
    webhookUrl: '',
    isActive: false,
  })

  useEffect(() => {
    loadIntegrations()
    loadProviders()
  }, [search, providerFilter])

  async function loadIntegrations() {
    try {
      const res = await api.get('/integrations', {
        params: { search, provider: providerFilter || undefined, page: 1, limit: 50 },
      })
      setIntegrations(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  async function loadProviders() {
    try {
      const res = await api.get('/integrations/providers')
      setProviders(res.data)
    } catch {
      // use defaults
    }
  }

  async function testIntegration(id: string) {
    try {
      const res = await api.post(`/integrations/${id}/test`)
      alert(res.data.message || 'Integration test passed!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Integration test failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Build config based on provider
    const config: Record<string, unknown> = {}
    if (form.provider === 'sendgrid') {
      config.apiKey = form.apiKey
    } else if (form.provider === 'mailgun') {
      config.apiKey = form.apiKey
      config.domain = form.domain
    } else if (form.provider === 'aws_ses') {
      config.region = form.region
      config.accessKeyId = form.accessKeyId
      config.secretAccessKey = form.secretAccessKey
    } else if (form.provider === 'smtp') {
      config.host = form.host
      config.port = parseInt(form.port) || 587
      config.user = form.user
      config.password = form.password
      config.from = form.from
    } else if (form.provider === 'slack') {
      config.webhookUrl = form.webhookUrl
    }

    try {
      await api.post('/integrations', {
        provider: form.provider,
        name: form.name,
        config,
        isActive: form.isActive,
      })
      setShowForm(false)
      loadIntegrations()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create integration')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect third-party services for email, notifications, and more
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Integration
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Integration</CardTitle>
            <CardDescription>
              Configure a third-party service connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label>Provider</Label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a provider</option>
                  {providers.map((p: any) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My SendGrid Account"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {form.provider === 'sendgrid' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="SG.xxxxxx"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  />
                </div>
              )}

              {form.provider === 'mailgun' && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="key-xxxxxx"
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="mg.example.com"
                      value={form.domain}
                      onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    />
                  </div>
                </>
              )}

              {form.provider === 'aws_ses' && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      type="text"
                      placeholder="us-east-1"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="accessKeyId">Access Key ID</Label>
                    <Input
                      id="accessKeyId"
                      type="text"
                      value={form.accessKeyId}
                      onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                    <Input
                      id="secretAccessKey"
                      type="password"
                      value={form.secretAccessKey}
                      onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
                    />
                  </div>
                </>
              )}

              {form.provider === 'smtp' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="host">SMTP Host</Label>
                      <Input
                        id="host"
                        type="text"
                        placeholder="smtp.example.com"
                        value={form.host}
                        onChange={(e) => setForm({ ...form, host: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="text"
                        value={form.port}
                        onChange={(e) => setForm({ ...form, port: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="user">Username</Label>
                      <Input
                        id="user"
                        type="text"
                        value={form.user}
                        onChange={(e) => setForm({ ...form, user: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="from">From Address</Label>
                    <Input
                      id="from"
                      type="email"
                      placeholder="noreply@example.com"
                      value={form.from}
                      onChange={(e) => setForm({ ...form, from: e.target.value })}
                    />
                  </div>
                </>
              )}

              {form.provider === 'slack' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="text"
                    placeholder="https://hooks.slack.com/services/xxx"
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-input bg-background text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Set as active</Label>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="integration-form">
              Create Integration
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Filters */}
      <Card className="border border-input">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 p-6">
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All providers</option>
                  {providers.map((p: any) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {integrations.length} total integrations
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integration</TableHead>
                  <TableHead className="text-center">Provider</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => {
                  const Icon = PROVIDER_ICONS[integration.provider] || Settings
                  return (
                    <TableRow key={integration.id}>
                      <TableCell className="w-1/3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {integration.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {integration.provider}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-1/4 text-center">
                        <Badge variant="outline">
                          {integration.provider.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-1/4 text-center">
                        <Badge
                          variant={integration.isActive ? 'default' : 'outline'}
                        >
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-1/3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testIntegration(integration.id)}
                          >
                            <Play className="h-3 w-3" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete integration "${integration.name}"?`,
                                )
                              ) {
                                // Delete via API
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {integrations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No integrations found
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

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground mb-1">
      {children}
    </label>
  )
}
