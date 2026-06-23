import 'vue-router'
import type { Permission } from '@/shared/auth/rbac'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiredPermissions?: Permission[]
  }
}
