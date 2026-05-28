<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrganizationsStore } from '@/modules/organizations/stores/organizations.store'

const organizationsStore = useOrganizationsStore()

onMounted(async () => {
  if (!organizationsStore.currentOrganization) {
    await organizationsStore.loadCurrentOrganization()
  }
})
</script>

<template>
  <v-select
    :items="
      organizationsStore.currentOrganization ? [organizationsStore.currentOrganization] : []
    "
    :model-value="organizationsStore.currentOrganization?.id"
    item-title="name"
    item-value="id"
    label="Organizacao"
    density="compact"
    variant="outlined"
    :loading="organizationsStore.isLoading"
    hide-details
  />
</template>
