import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuards } from '@/router/guards/auth.guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/pages/LoginPage.vue'),
      meta: {
        title: 'Login',
      },
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('@/modules/auth/pages/LogoutPage.vue'),
      meta: {
        title: 'Logout',
      },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
    },
  ],
})

setupAuthGuards(router)

export default router
