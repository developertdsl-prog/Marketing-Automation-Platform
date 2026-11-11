export interface ApiError {
  statusCode: number
  message: string | string[]
  timestamp: string
  path: string
  method: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Role {
  id: string
  name: string
  key: string
  permissions: string[]
}

export interface Team {
  id: string
  name: string
  description?: string
}

export interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  jobTitle?: string
  city?: string
  country?: string
  customFields?: Record<string, unknown>
  isUnsubscribed: boolean
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  status: string
  scheduleAt?: string
  startedAt?: string
  completedAt?: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  status: string
  score: number
  source?: string
  value?: number
  createdAt: string
  updatedAt: string
}
