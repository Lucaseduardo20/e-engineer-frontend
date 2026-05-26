import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setupAuthGuards } from '@/router/guards/auth.guard'
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/modules/auth/constants/auth-storage.constants'

function createGuardedRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: {
          template: '<div>Login</div>',
        },
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: {
          template: '<div>Dashboard</div>',
        },
        meta: {
          requiresAuth: true,
        },
      },
    ],
  })

  setupAuthGuards(router)

  return router
}

describe('auth guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('redirects protected routes to login when session is missing', async () => {
    const router = createGuardedRouter()

    await router.push('/dashboard')

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
  })

  it('allows protected routes when a session is restored', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token')
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        id: 'user-1',
        email: 'engenharia@empresa.com',
        name: 'Marina Azevedo',
        organizationId: 'org-1',
      }),
    )

    const router = createGuardedRouter()

    await router.push('/dashboard')

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})

