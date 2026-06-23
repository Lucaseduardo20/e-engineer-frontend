import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AxiosError } from 'axios'
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/modules/auth/constants/auth-storage.constants'
import { authService } from '@/modules/auth/services/auth.service'
import type { LoginCredentials, User } from '@/modules/auth/types/auth.types'
import { hasAllPermissions, hasPermission, permissionsForUser } from '@/shared/auth/rbac'
import type { Permission } from '@/shared/auth/rbac'
import { getApiErrorMessage } from '@/shared/http/api-error'

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
      isPlatformAdmin: parsed.isPlatformAdmin ?? false,
      impersonatedBy: parsed.impersonatedBy ?? null,
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

  return getApiErrorMessage(error, 'Nao foi possivel entrar. Tente novamente em alguns instantes.')
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
  const isPlatformAdmin = computed(() => user.value?.isPlatformAdmin === true)
  const isImpersonating = computed(() => Boolean(user.value?.impersonatedBy))
  const permissions = computed(() => permissionsForUser(user.value))

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

  function replaceToken(nextToken: string) {
    if (!user.value) {
      return
    }

    token.value = nextToken
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken)
  }

  function replaceSession(nextToken: string, nextUser: User) {
    persistSession(nextToken, nextUser)
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

  function can(permission: Permission) {
    return hasPermission(user.value, permission)
  }

  function canAll(requiredPermissions: Permission[]) {
    return hasAllPermissions(user.value, requiredPermissions)
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
    isPlatformAdmin,
    isImpersonating,
    permissions,
    login,
    logout,
    replaceToken,
    replaceSession,
    restoreSession,
    clearError,
    can,
    canAll,
  }
})
