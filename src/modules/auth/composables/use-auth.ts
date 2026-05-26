import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { LoginCredentials } from '@/modules/auth/types/auth.types'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const organizationId = computed(() => authStore.organizationId)

  async function login(credentials: LoginCredentials, redirectTo = '/dashboard') {
    await authStore.login(credentials)
    await router.push(redirectTo)
  }

  async function logout() {
    authStore.logout()
    await router.push('/login')
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    organizationId,
    login,
    logout,
  }
}

