import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/modules/auth/constants/auth-storage.constants'
import { authService } from '@/modules/auth/services/auth.service'
import { useAuthStore } from './auth.store'

vi.mock('@/modules/auth/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('logs in and persists the session', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'signed-token',
      user: {
        id: 'user-1',
        fullName: 'Marina Azevedo',
        email: 'marina@empresa.com',
        roles: [],
        organizationId: 'org-1',
      },
    })
    const store = useAuthStore()

    await store.login({ email: 'marina@empresa.com', password: 'Senha123' })

    expect(store.isAuthenticated).toBe(true)
    expect(store.userName).toBe('Marina Azevedo')
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('signed-token')
  })

  it('maps unauthorized login failures to a friendly message', async () => {
    const error = new AxiosError('Unauthorized')
    error.response = {
      config: {} as never,
      data: { code: 'UnauthorizedException', message: 'Invalid credentials.' },
      headers: {},
      status: 401,
      statusText: 'Unauthorized',
    }
    vi.mocked(authService.login).mockRejectedValue(error)
    const store = useAuthStore()

    await expect(
      store.login({ email: 'marina@empresa.com', password: 'Senha123' }),
    ).rejects.toThrow('Unauthorized')

    expect(store.error).toBe('Email ou senha invalidos.')
    expect(store.isLoading).toBe(false)
  })

  it('restores legacy stored users and replaces refreshed tokens', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stored-token')
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        id: 'user-1',
        name: 'Marina Azevedo',
        email: 'marina@empresa.com',
        organizationId: 'org-1',
      }),
    )
    const store = useAuthStore()

    store.restoreSession()
    store.replaceToken('fresh-token')

    expect(store.user?.fullName).toBe('Marina Azevedo')
    expect(store.user?.roles).toEqual([])
    expect(store.token).toBe('fresh-token')
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('fresh-token')
  })
})
