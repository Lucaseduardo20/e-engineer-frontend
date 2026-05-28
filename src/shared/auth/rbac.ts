import type { User } from '@/shared/types/api-contracts'

export const permissions = {
  dashboard: {
    read: 'dashboard.read',
  },
  projects: {
    read: 'projects.read',
  },
  deliverables: {
    read: 'deliverables.read',
  },
  documents: {
    read: 'documents.read',
  },
  reviews: {
    read: 'reviews.read',
  },
  organization: {
    read: 'organization.read',
    updateProfile: 'organization.profile.update',
    updateLogo: 'organization.logo.update',
    membersRead: 'organization.members.read',
    membersManage: 'organization.members.manage',
    membersSecurityManage: 'organization.members.security.manage',
    membersClone: 'organization.members.clone',
  },
  priority: {
    request: 'priority.request',
    apply: 'priority.apply',
  },
  platform: {
    tenantsRead: 'platform.tenants.read',
    tenantSwitch: 'platform.tenant.switch',
    impersonate: 'platform.impersonate',
  },
} as const

export type Permission =
  | 'dashboard.read'
  | 'projects.read'
  | 'deliverables.read'
  | 'documents.read'
  | 'reviews.read'
  | 'organization.read'
  | 'organization.profile.update'
  | 'organization.logo.update'
  | 'organization.members.read'
  | 'organization.members.manage'
  | 'organization.members.security.manage'
  | 'organization.members.clone'
  | 'priority.request'
  | 'priority.apply'
  | 'platform.tenants.read'
  | 'platform.tenant.switch'
  | 'platform.impersonate'

const allPermissions = Object.values(permissions).flatMap((group) =>
  Object.values(group),
) as Permission[]

const rolePermissions: Record<string, Permission[]> = {
  owner: allPermissions.filter((permission) => !permission.startsWith('platform.')),
  admin: allPermissions.filter((permission) => !permission.startsWith('platform.')),
  manager: [
    permissions.dashboard.read,
    permissions.projects.read,
    permissions.deliverables.read,
    permissions.documents.read,
    permissions.reviews.read,
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
    permissions.priority.apply,
  ],
  project_manager: [
    permissions.dashboard.read,
    permissions.projects.read,
    permissions.deliverables.read,
    permissions.documents.read,
    permissions.reviews.read,
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  estimator: [
    permissions.dashboard.read,
    permissions.projects.read,
    permissions.deliverables.read,
    permissions.documents.read,
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  finance: [
    permissions.dashboard.read,
    permissions.projects.read,
    permissions.deliverables.read,
    permissions.documents.read,
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  member: [
    permissions.dashboard.read,
    permissions.projects.read,
    permissions.deliverables.read,
    permissions.documents.read,
    permissions.reviews.read,
    permissions.priority.request,
  ],
}

export function permissionsForUser(user: User | null): Permission[] {
  if (!user) {
    return []
  }

  if (user.isPlatformAdmin) {
    return allPermissions
  }

  const fallbackPermissions = rolePermissions.member ?? []

  return [...new Set(user.roles.flatMap((role) => rolePermissions[role] ?? fallbackPermissions))]
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  return permissionsForUser(user).includes(permission)
}

export function hasAllPermissions(user: User | null, required: Permission[]): boolean {
  return required.every((permission) => hasPermission(user, permission))
}
