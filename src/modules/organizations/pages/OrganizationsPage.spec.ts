import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import OrganizationsPage from './OrganizationsPage.vue'

const loadOverview = vi.fn()

vi.mock('@/modules/organizations/stores/organizations.store', () => ({
  useOrganizationsStore: () => ({
    currentOrganization: {
      id: 'org-1',
      name: 'Engenharia Horizonte Ltda',
      slug: 'engenharia-horizonte-ltda',
      parentId: null,
    },
    users: [
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
    ],
    isLoading: false,
    error: null,
    ownerUsers: [{ id: 'user-1' }],
    technicalUsers: [{ id: 'user-2' }],
    loadOverview,
  }),
}))

describe('OrganizationsPage', () => {
  it('renders organization identity and users from the store', () => {
    const wrapper = shallowMount(OrganizationsPage, {
      global: {
        stubs: {
          BasePageHeader: {
            template: '<header><slot name="actions" /></header>',
          },
          VAlert: {
            template: '<div><slot /></div>',
          },
          VAvatar: {
            template: '<span><slot /></span>',
          },
          VChip: {
            template: '<span><slot /></span>',
          },
          VContainer: {
            template: '<main><slot /></main>',
          },
          VProgressLinear: {
            template: '<div />',
          },
          VSheet: {
            template: '<section><slot /></section>',
          },
        },
      },
    })

    expect(loadOverview).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Engenharia Horizonte Ltda')
    expect(wrapper.text()).toContain('Lucas Eduardo')
    expect(wrapper.text()).toContain('Marina Costa')
    expect(wrapper.text()).toContain('Proprietario')
  })
})
