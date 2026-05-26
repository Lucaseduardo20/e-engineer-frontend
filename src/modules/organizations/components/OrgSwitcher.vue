<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import type { Organization } from '@/shared/types/api-contracts'

const organization = ref<Organization | null>(null)

onMounted(async () => {
  organization.value = await apiClient.organizations.current()
})
</script>

<template>
  <v-select
    :items="organization ? [organization] : []"
    :model-value="organization?.id"
    item-title="name"
    item-value="id"
    label="Organizacao"
    density="compact"
    variant="outlined"
    hide-details
  />
</template>
