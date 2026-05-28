import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import OrganizationsPage from './OrganizationsPage.vue'

const loadOverview = vi.fn()
const refreshManagement = vi.fn().mockResolvedValue(null)
const loadPlatformOrganizations = vi.fn()

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
    priorityRequests: [],
    platformOrganizations: [],
    isLoading: false,
    isSaving: false,
    error: null,
    ownerUsers: [{ id: 'user-1' }],
    technicalUsers: [{ id: 'user-2' }],
    loadOverview,
    refreshManagement,
    loadPlatformOrganizations,
    updateOrganization: vi.fn(),
    uploadLogo: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    uploadUserAvatar: vi.fn(),
    cloneUser: vi.fn(),
    createPriorityRequest: vi.fn(),
    decidePriorityRequest: vi.fn(),
  }),
}))

vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    isPlatformAdmin: false,
    replaceSession: vi.fn(),
    can: vi.fn().mockReturnValue(false),
  }),
}))

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    auth: {
      switchTenant: vi.fn(),
      impersonate: vi.fn(),
    },
  },
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
          VTabs: {
            template: '<nav><slot /></nav>',
          },
          VTab: {
            template: '<button><slot /></button>',
          },
          VWindow: {
            template: '<div><slot /></div>',
          },
          VWindowItem: {
            template: '<div><slot /></div>',
          },
          VIcon: {
            template: '<i />',
          },
          VImg: {
            template: '<img />',
          },
          VBtn: {
            template: '<button><slot /></button>',
          },
          VFileInput: {
            template: '<input />',
          },
          VTextField: {
            template: '<input />',
          },
          VTextarea: {
            template: '<textarea />',
          },
          VSelect: {
            template: '<select />',
          },
          VDialog: {
            template: '<div><slot /></div>',
          },
          VCard: {
            template: '<div><slot /></div>',
          },
          VCardTitle: {
            template: '<h3><slot /></h3>',
          },
          VCardText: {
            template: '<div><slot /></div>',
          },
          VCardActions: {
            template: '<footer><slot /></footer>',
          },
          VSpacer: {
            template: '<span />',
          },
          VTooltip: {
            template: '<span><slot name="activator" :props="{}" /><slot /></span>',
          },
        },
      },
    })

    expect(refreshManagement).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Engenharia Horizonte Ltda')
    expect(wrapper.text()).toContain('Lucas Eduardo')
    expect(wrapper.text()).toContain('Marina Costa')
    expect(wrapper.text()).toContain('Owner')
  })
})
