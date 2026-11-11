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
import { Plus, Search, MailPlus, Code, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [search])

  async function loadTemplates() {
    try {
      const res = await api.get('/email-templates', {
        params: { search, page: 1, limit: 50 },
      })
      setTemplates(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load templates')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage your email templates
          </p>
        </div>
        <Link href="/templates/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Template
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Search */}
      <Card className="border border-input">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-center">Subject</TableHead>
                  <TableHead className="text-center">Used In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                          <MailPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {template.isDefault ? 'Default template' : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-1/3 text-center">
                      <span className="text-muted-foreground text-sm">
                        "{template.subject}"
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-center">
                      <span className="text-muted-foreground text-sm">
                        {template._count?.campaigns || 0}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <Link
                        href={`/campaigns/new`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Use <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No templates found
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
