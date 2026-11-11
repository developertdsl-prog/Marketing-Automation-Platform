'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for auth store to hydrate from localStorage
  if (!mounted || isLoading) {
    return null
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/auth/login')
  }

  return null
}
