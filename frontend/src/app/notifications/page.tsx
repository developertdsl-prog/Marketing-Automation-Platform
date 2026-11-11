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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, X, ArrowLeft, Mail, Users } from 'lucide-react'
import Link from 'next/link'

const TYPE_BADGE: Record<string, string> = {
  info: 'outline',
  success: 'default',
  warning: 'secondary',
  error: 'destructive',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications', {
        params: { page: 1, limit: 50 },
      })
      setNotifications(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  async function loadUnreadCount() {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.unreadCount)
    } catch {
      // ignore
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as read')
    }
  }

  async function markAllAsRead() {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all as read')
    }
  }

  async function removeNotification(id: string) {
    if (!window.confirm('Delete this notification?')) return
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete notification')
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
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary mb-2 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your in-app notifications
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {unreadCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</span>
          </div>
          <Button
            size="sm"
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`
                border-l-4 ${
                  notification.isRead
                    ? 'border-transparent bg-transparent'
                    : 'border-primary bg-blue-50/50'
                }
                transition-all
              `}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          (TYPE_BADGE[notification.type] ||
                            'outline') as 'default' | 'destructive' | 'outline' | 'secondary'
                        }
                      >
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </Badge>
                      {!notification.isRead && (
                        <span className="text-xs font-bold text-primary">
                          NEW
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeNotification(notification.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-sm font-medium text-foreground">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
