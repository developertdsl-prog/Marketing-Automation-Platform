'use client'

import { Menu, Bell, Search, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-background bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-12">
          <div className="relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search campaigns, contacts..."
              className="pl-9 h-9 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="p-2 rounded-md text-muted-foreground hover:bg-accent"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">JD</div>
        </div>
      </div>
    </header>
  )
}
