import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import type { Organization, PriorityRequest, User } from '@/shared/types/api-contracts'
import type {
  CloneOrganizationMemberRequest,
  CreateOrganizationMemberRequest,
  CreatePriorityRequestRequest,
  UpdateOrganizationMemberRequest,
  UpdateOrganizationProfileRequest,
} from '@/shared/http/api-client'

export const useOrganizationsStore = defineStore('organizations', () => {
  const currentOrganization = ref<Organization | null>(null)
  const platformOrganizations = ref<Organization[]>([])
  const users = ref<User[]>([])
  const priorityRequests = ref<PriorityRequest[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const ownerUsers = computed(() =>
    users.value.filter((user) => user.roles.includes('owner') || user.roles.includes('admin')),
  )

  const technicalUsers = computed(() =>
    users.value.filter((user) => !user.roles.includes('owner') && !user.roles.includes('admin')),
  )

  async function loadCurrentOrganization() {
    isLoading.value = true
    error.value = null

    try {
      currentOrganization.value = await apiClient.organizations.current()
      return currentOrganization.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar a organizacao.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadUsers() {
    isLoading.value = true
    error.value = null

    try {
      users.value = await apiClient.organizations.users()
      return users.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os usuarios.')
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function loadOverview() {
    isLoading.value = true
    error.value = null

    try {
      const [organization, organizationUsers] = await Promise.all([
        apiClient.organizations.current(),
        apiClient.organizations.users(),
      ])
      currentOrganization.value = organization
      users.value = organizationUsers
      return { organization, users: organizationUsers }
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar a organizacao.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadPlatformOrganizations() {
    try {
      platformOrganizations.value = await apiClient.organizations.list()
      return platformOrganizations.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os tenants.')
      return []
    }
  }

  async function loadPriorityRequests() {
    try {
      priorityRequests.value = await apiClient.priorityRequests.list()
      return priorityRequests.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar prioridades.')
      return []
    }
  }

  async function refreshManagement() {
    isLoading.value = true
    error.value = null

    try {
      const [overview] = await Promise.all([loadOverview(), loadPriorityRequests()])
      return overview
    } finally {
      isLoading.value = false
    }
  }

  async function updateOrganization(payload: UpdateOrganizationProfileRequest) {
    return save(async () => {
      currentOrganization.value = await apiClient.organizations.updateCurrent(payload)
      return currentOrganization.value
    }, 'Nao foi possivel atualizar a organizacao.')
  }

  async function uploadLogo(file: File) {
    return save(async () => {
      currentOrganization.value = await apiClient.organizations.uploadLogo(file)
      return currentOrganization.value
    }, 'Nao foi possivel atualizar o logo.')
  }

  async function createUser(payload: CreateOrganizationMemberRequest) {
    return save(async () => {
      const user = await apiClient.organizations.createUser(payload)
      users.value = [...users.value, user].sort((a, b) => a.fullName.localeCompare(b.fullName))
      return user
    }, 'Nao foi possivel criar o colaborador.')
  }

  async function updateUser(userId: string, payload: UpdateOrganizationMemberRequest) {
    return save(async () => {
      const user = await apiClient.organizations.updateUser(userId, payload)
      users.value = users.value.map((currentUser) =>
        currentUser.id === user.id ? user : currentUser,
      )
      return user
    }, 'Nao foi possivel atualizar o colaborador.')
  }

  async function uploadUserAvatar(userId: string, file: File) {
    return save(async () => {
      const user = await apiClient.organizations.uploadUserAvatar(userId, file)
      users.value = users.value.map((currentUser) =>
        currentUser.id === user.id ? user : currentUser,
      )
      return user
    }, 'Nao foi possivel atualizar a foto.')
  }

  async function cloneUser(userId: string, payload: CloneOrganizationMemberRequest) {
    return save(async () => {
      const user = await apiClient.organizations.cloneUser(userId, payload)
      users.value = [...users.value, user].sort((a, b) => a.fullName.localeCompare(b.fullName))
      return user
    }, 'Nao foi possivel clonar o colaborador.')
  }

  async function createPriorityRequest(payload: CreatePriorityRequestRequest) {
    return save(async () => {
      const priorityRequest = await apiClient.priorityRequests.create(payload)
      priorityRequests.value = [priorityRequest, ...priorityRequests.value]
      return priorityRequest
    }, 'Nao foi possivel solicitar prioridade.')
  }

  async function decidePriorityRequest(id: string, decision: 'apply' | 'reject') {
    return save(async () => {
      const priorityRequest =
        decision === 'apply'
          ? await apiClient.priorityRequests.apply(id)
          : await apiClient.priorityRequests.reject(id)
      priorityRequests.value = priorityRequests.value.map((currentRequest) =>
        currentRequest.id === priorityRequest.id ? priorityRequest : currentRequest,
      )
      return priorityRequest
    }, 'Nao foi possivel decidir a prioridade.')
  }

  async function save<T>(operation: () => Promise<T>, fallbackMessage: string) {
    isSaving.value = true
    error.value = null

    try {
      return await operation()
    } catch (saveError) {
      error.value = getApiErrorMessage(saveError, fallbackMessage)
      return null
    } finally {
      isSaving.value = false
    }
  }

  return {
    currentOrganization,
    platformOrganizations,
    users,
    priorityRequests,
    isLoading,
    isSaving,
    error,
    ownerUsers,
    technicalUsers,
    loadCurrentOrganization,
    loadUsers,
    loadOverview,
    loadPlatformOrganizations,
    loadPriorityRequests,
    refreshManagement,
    updateOrganization,
    uploadLogo,
    createUser,
    updateUser,
    uploadUserAvatar,
    cloneUser,
    createPriorityRequest,
    decidePriorityRequest,
  }
})
