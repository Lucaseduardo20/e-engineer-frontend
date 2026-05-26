import type { User } from '@/shared/types/api-contracts'

export type { User }

export type AuthToken = {
  token: string
  user: User
}

export type LoginCredentials = {
  email: string
  password: string
}

export type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
