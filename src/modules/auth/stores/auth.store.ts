import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AxiosError } from 'axios'
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/modules/auth/constants/auth-storage.constants'
import { authService } from '@/modules/auth/services/auth.service'
import type { LoginCredentials, User } from '@/modules/auth/types/auth.types'

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    const parsed = JSON.parse(storedUser) as User & { name?: string }
    return {
      ...parsed,
      fullName: parsed.fullName ?? parsed.name ?? 'Usuario',
      roles: parsed.roles ?? [],
    }
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return 'Email ou senha invalidos.'
    }

    if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
      return 'Nao foi possivel conectar ao servidor. Verifique se a API esta rodando.'
    }
  }

  return 'Nao foi possivel entrar. Tente novamente em alguns instantes.'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasRestoredSession = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const organizationId = computed(() => user.value?.organizationId ?? null)
  const userName = computed(() => user.value?.fullName ?? null)

  function persistSession(nextToken: string, nextUser: User) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser))
  }

  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const authToken = await authService.login(credentials)
      persistSession(authToken.token, authToken.user)
    } catch (loginError) {
      error.value = getLoginErrorMessage(loginError)
      throw loginError
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    error.value = null
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  }

  function restoreSession() {
    if (hasRestoredSession.value) {
      return
    }

    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    const storedUser = readStoredUser()

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = storedUser
    } else {
      logout()
    }

    hasRestoredSession.value = true
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    token,
    isLoading,
    error,
    hasRestoredSession,
    isAuthenticated,
    organizationId,
    userName,
    login,
    logout,
    restoreSession,
    clearError,
  }
})
