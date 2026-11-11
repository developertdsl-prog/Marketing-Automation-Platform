'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'

export function Providers({ children }: { children: ReactNode }) {
  const { setAuth, setLoading, tokens } = useAuthStore()

  useEffect(() => {
    // Restore auth from localStorage on app load
    const accessToken = localStorage.getItem('map_access_token')
    const userStr = localStorage.getItem('map_user')

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuth(user, { accessToken, refreshToken: localStorage.getItem('map_refresh_token') || '' })
      } catch {
        // ignore parse errors
      }
    }
    setLoading(false)
  }, [setAuth, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
