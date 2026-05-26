import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        component: {
          template: '<div>Login</div>',
        },
      },
      {
        path: '/dashboard',
        component: {
          template: '<div>Dashboard</div>',
        },
        meta: {
          requiresAuth: true,
        },
      },
    ],
  })
}

describe('App', () => {
  it('renders public routes without authenticated chrome', async () => {
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          AuthenticatedLayout: {
            template: '<section data-test="authenticated-layout"><slot /></section>',
          },
          UnauthenticatedLayout: {
            template: '<section data-test="unauthenticated-layout"><slot /></section>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="unauthenticated-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="authenticated-layout"]').exists()).toBe(false)
  })

  it('renders protected routes inside authenticated layout', async () => {
    const router = createTestRouter()
    await router.push('/dashboard')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          AuthenticatedLayout: {
            template: '<section data-test="authenticated-layout"><slot /></section>',
          },
          UnauthenticatedLayout: {
            template: '<section data-test="unauthenticated-layout"><slot /></section>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="authenticated-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="unauthenticated-layout"]').exists()).toBe(false)
  })
})
