<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useOrganizationsStore } from '@/modules/organizations/stores/organizations.store'
import { apiClient } from '@/shared/http/api-client'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const isSwitching = ref(false)

const organizationItems = computed(() => {
  if (authStore.isPlatformAdmin && organizationsStore.platformOrganizations.length > 0) {
    return organizationsStore.platformOrganizations
  }

  return organizationsStore.currentOrganization ? [organizationsStore.currentOrganization] : []
})

onMounted(async () => {
  if (!organizationsStore.currentOrganization) {
    await organizationsStore.loadCurrentOrganization()
  }

  if (authStore.isPlatformAdmin) {
    await organizationsStore.loadPlatformOrganizations()
  }
})

async function switchOrganization(organizationId: string | null) {
  if (
    !organizationId ||
    organizationId === organizationsStore.currentOrganization?.id ||
    !authStore.isPlatformAdmin
  ) {
    return
  }

  isSwitching.value = true
  organizationsStore.error = null

  try {
    const session = await apiClient.auth.switchTenant({ organizationId })
    authStore.replaceSession(session.token, session.user)
    await organizationsStore.refreshManagement()
  } catch {
    organizationsStore.error = 'Nao foi possivel trocar de tenant.'
  } finally {
    isSwitching.value = false
  }
}
</script>

<template>
  <v-select
    :items="organizationItems"
    :model-value="organizationsStore.currentOrganization?.id"
    item-title="name"
    item-value="id"
    :label="authStore.isPlatformAdmin ? 'Tenant ativo' : 'Organizacao'"
    density="compact"
    variant="outlined"
    :loading="organizationsStore.isLoading || isSwitching"
    hide-details
    @update:model-value="switchOrganization"
  />
</template>
