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
import { Plus, Search, Tag, User, Mail, Phone, Building } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'

export default function ContactsPage() {
  const { user } = useAuthStore()
  const [contacts, setContacts] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadContacts()
    loadTags()
  }, [search, selectedTag, user?.organization?.id])

  async function loadContacts() {
    try {
      const res = await api.get('/contacts', {
        params: { search, tag: selectedTag || undefined, page: 1, limit: 50 },
      })
      setContacts(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  async function loadTags() {
    try {
      const res = await api.get('/contacts/tags')
      setTags(res.data)
    } catch {
      // ignore
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
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and segmentation
          </p>
        </div>
        <Link href="/contacts/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Contact
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end p-6">
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-full lg:w-64">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {contacts.length} total
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Tags</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {contact.firstName?.[0]}{contact.lastName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.email}
                          </p>
                          {contact.company && (
                            <p className="text-xs text-muted-foreground">
                              <Building className="h-3 w-3 mr-1 inline" />
                              {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-1/4 text-center">
                      {contact.tags?.length ? (
                        contact.tags.map((t: any) => (
                          <Badge
                            key={t.tag}
                            variant="outline"
                            className="mr-1 mb-1 text-xs"
                          >
                            {t.tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <span className="text-muted-foreground">
                        {contact._count?.campaignRecipients || 0}
                      </span>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <Badge
                        variant={
                          contact.isUnsubscribed
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {contact.isUnsubscribed ? 'Unsubscribed' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-1/6 text-right">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View <Mail className="ml-1 h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {contacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No contacts found
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
