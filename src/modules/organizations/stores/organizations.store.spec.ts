import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { useOrganizationsStore } from './organizations.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    organizations: {
      current: vi.fn(),
      users: vi.fn(),
    },
  },
}))

describe('organizations store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads organization overview and separates admin users', async () => {
    vi.mocked(apiClient.organizations.current).mockResolvedValue({
      id: 'org-1',
      name: 'Engenharia Horizonte Ltda',
      slug: 'engenharia-horizonte-ltda',
      parentId: null,
    })
    vi.mocked(apiClient.organizations.users).mockResolvedValue([
      {
        id: 'user-1',
        fullName: 'Lucas Eduardo',
        email: 'admin@engflow.local',
        roles: ['owner'],
        organizationId: 'org-1',
      },
      {
        id: 'user-2',
        fullName: 'Marina Costa',
        email: 'marina@engflow.local',
        roles: ['member'],
        organizationId: 'org-1',
      },
    ])
    const store = useOrganizationsStore()

    await store.loadOverview()

    expect(store.currentOrganization?.name).toBe('Engenharia Horizonte Ltda')
    expect(store.users).toHaveLength(2)
    expect(store.ownerUsers).toHaveLength(1)
    expect(store.technicalUsers).toHaveLength(1)
  })

  it('stores a readable error when overview loading fails', async () => {
    vi.mocked(apiClient.organizations.current).mockRejectedValue(new Error('boom'))
    vi.mocked(apiClient.organizations.users).mockResolvedValue([])
    const store = useOrganizationsStore()

    await expect(store.loadOverview()).resolves.toBeNull()

    expect(store.error).toBe('Nao foi possivel carregar a organizacao.')
  })
})
