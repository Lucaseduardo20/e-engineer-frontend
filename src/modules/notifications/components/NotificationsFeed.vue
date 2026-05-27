<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import type { AuditLogEntry } from '@/shared/types/api-contracts'
import { getApiErrorMessage } from '@/shared/http/api-error'

const notifications = ref<AuditLogEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    notifications.value = (await apiClient.audit.list({ page: 1, pageSize: 6 })).items
  } catch (loadError) {
    error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os eventos recentes.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-card class="side-panel" variant="flat" rounded="lg">
    <v-card-title class="side-panel__title">
      <v-icon icon="$info" color="indigo" size="19" />
      Ultimos eventos
    </v-card-title>
    <v-progress-linear v-if="loading" indeterminate color="indigo" />
    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-3">
      {{ error }}
    </v-alert>
    <v-list v-else lines="two" bg-color="transparent">
      <v-list-item
        v-for="notification in notifications"
        :key="notification.id"
        :title="notification.description"
        :subtitle="notification.actorName"
      >
        <template #prepend>
          <v-avatar color="indigo" variant="tonal" size="32">
            <v-icon icon="$info" size="16" />
          </v-avatar>
        </template>
      </v-list-item>
      <v-list-item v-if="!loading && notifications.length === 0" title="Sem eventos recentes" />
    </v-list>
  </v-card>
</template>

<style scoped>
.side-panel {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.side-panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #d8e1de;
  color: #14231f;
  font-size: 1rem;
  font-weight: 850;
}
</style>
