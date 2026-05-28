import type { Router } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { Permission } from '@/shared/auth/rbac'

export function setupAuthGuards(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()
    authStore.restoreSession()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    const requiredPermissions = (to.meta.requiredPermissions ?? []) as Permission[]

    if (
      to.meta.requiresAuth &&
      requiredPermissions.length &&
      !authStore.canAll(requiredPermissions)
    ) {
      if (to.name === 'dashboard') {
        return true
      }

      return '/dashboard'
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
      return '/dashboard'
    }

    return true
  })
}
