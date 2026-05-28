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
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/modules/projects/pages/ProjectsListPage.vue'),
      meta: {
        title: 'Projetos',
        requiresAuth: true,
      },
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/modules/projects/pages/ProjectDetailPage.vue'),
      meta: {
        title: 'Projeto',
        requiresAuth: true,
      },
    },
    {
      path: '/projects/:projectId/deliverables',
      name: 'deliverables',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Entregaveis',
        requiresAuth: true,
      },
    },
    {
      path: '/projects/:projectId/deliverables/new',
      name: 'deliverable-create',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Novo entregavel',
        requiresAuth: true,
      },
    },
    {
      path: '/projects/:projectId/deliverables/:deliverableId/edit',
      name: 'deliverable-edit',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Editar entregavel',
        requiresAuth: true,
      },
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/modules/reviews/pages/ReviewsPage.vue'),
      meta: {
        title: 'Revisoes',
        requiresAuth: true,
      },
    },
    {
      path: '/reviews/:reviewId',
      name: 'review-detail',
      component: () => import('@/modules/reviews/pages/ReviewsPage.vue'),
      meta: {
        title: 'Revisao',
        requiresAuth: true,
      },
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('@/modules/documents/pages/DocumentsPage.vue'),
      meta: {
        title: 'Documentos',
        requiresAuth: true,
      },
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: () => import('@/modules/organizations/pages/OrganizationsPage.vue'),
      meta: {
        title: 'Organizacao',
        requiresAuth: true,
      },
    },
  ],
})

setupAuthGuards(router)

export default router
