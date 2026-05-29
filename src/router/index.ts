import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuards } from '@/router/guards/auth.guard'
import { permissions } from '@/shared/auth/rbac'

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
        requiredPermissions: [permissions.dashboard.read],
      },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/modules/projects/pages/ProjectsListPage.vue'),
      meta: {
        title: 'Projetos',
        requiresAuth: true,
        requiredPermissions: [permissions.projects.read],
      },
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/modules/projects/pages/ProjectDetailPage.vue'),
      meta: {
        title: 'Projeto',
        requiresAuth: true,
        requiredPermissions: [permissions.projects.read],
      },
    },
    {
      path: '/projects/:projectId/deliverables',
      name: 'deliverables',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Entregaveis',
        requiresAuth: true,
        requiredPermissions: [permissions.deliverables.read],
      },
    },
    {
      path: '/projects/:projectId/deliverables/new',
      name: 'deliverable-create',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Novo entregavel',
        requiresAuth: true,
        requiredPermissions: [permissions.deliverables.read],
      },
    },
    {
      path: '/projects/:projectId/deliverables/:deliverableId/edit',
      name: 'deliverable-edit',
      component: () => import('@/modules/deliverables/pages/DeliverablesPage.vue'),
      meta: {
        title: 'Editar entregavel',
        requiresAuth: true,
        requiredPermissions: [permissions.deliverables.read],
      },
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/modules/reviews/pages/ReviewsPage.vue'),
      meta: {
        title: 'Revisoes',
        requiresAuth: true,
        requiredPermissions: [permissions.reviews.read],
      },
    },
    {
      path: '/reviews/:reviewId',
      name: 'review-detail',
      component: () => import('@/modules/reviews/pages/ReviewsPage.vue'),
      meta: {
        title: 'Revisao',
        requiresAuth: true,
        requiredPermissions: [permissions.reviews.read],
      },
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('@/modules/documents/pages/DocumentsPage.vue'),
      meta: {
        title: 'Documentos',
        requiresAuth: true,
        requiredPermissions: [permissions.documents.read],
      },
    },
    {
      path: '/knowledge-base',
      name: 'knowledge-base',
      component: () => import('@/modules/knowledge-base/pages/KnowledgeBaseListPage.vue'),
      meta: {
        title: 'Base de Conhecimento',
        requiresAuth: true,
        requiredPermissions: [permissions.knowledge.read],
      },
    },
    {
      path: '/knowledge-base/:id',
      name: 'knowledge-base-detail',
      component: () => import('@/modules/knowledge-base/pages/KnowledgeBaseDetailPage.vue'),
      meta: {
        title: 'Detalhe do Item',
        requiresAuth: true,
        requiredPermissions: [permissions.knowledge.read],
      },
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: () => import('@/modules/organizations/pages/OrganizationsPage.vue'),
      meta: {
        title: 'Organizacao',
        requiresAuth: true,
        requiredPermissions: [permissions.organization.read],
      },
    },
  ],
})

setupAuthGuards(router)

export default router
