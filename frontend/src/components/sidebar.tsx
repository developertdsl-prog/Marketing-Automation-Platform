'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  Settings,
  MailPlus,
  Target,
  LogOut,
  Bot,
  MessageSquare,
  ShieldCheck,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarFallback } from '@/components/ui/avatar'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Email Templates', href: '/templates', icon: MailPlus },
  { name: 'Automation', href: '/workflows', icon: Bot },
  { name: 'Integrations', href: '/integrations', icon: ShieldCheck },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="hidden lg:flex lg:w-64 flex-col border-r border-border bg-background">
      <div className="h-14 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            M
          </div>
          <span className="font-semibold text-lg tracking-tight">MarketX</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
            <AvatarFallback className="h-full w-full">
              {user?.firstName?.[0]}{user?.lastName?.[0] || 'U'}
            </AvatarFallback>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.organization?.name}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
