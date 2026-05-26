import type { Router } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

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

    if (to.name === 'login' && authStore.isAuthenticated) {
      return '/dashboard'
    }

    return true
  })
}

