import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import type { Organization, User } from '@/shared/types/api-contracts'

export const useOrganizationsStore = defineStore('organizations', () => {
  const currentOrganization = ref<Organization | null>(null)
  const users = ref<User[]>([])
  const isLoading = ref(false)
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

  return {
    currentOrganization,
    users,
    isLoading,
    error,
    ownerUsers,
    technicalUsers,
    loadCurrentOrganization,
    loadUsers,
    loadOverview,
  }
})
