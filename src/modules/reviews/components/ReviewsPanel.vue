<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import type { ReviewSummary } from '@/shared/types/api-contracts'
import { reviewBadgeKind } from '@/shared/ui/status-badges'
import { getApiErrorMessage } from '@/shared/http/api-error'

const reviews = ref<ReviewSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    reviews.value = (await apiClient.reviews.list({ page: 1, pageSize: 5 })).items
  } catch (loadError) {
    error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar as revisoes.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-card class="side-panel" variant="flat" rounded="lg">
    <v-card-title class="side-panel__title">
      <v-icon icon="$search" color="amber" size="19" />
      Revisoes pendentes
    </v-card-title>
    <v-progress-linear v-if="loading" indeterminate color="amber" />
    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-3">
      {{ error }}
    </v-alert>
    <v-list v-else lines="two" bg-color="transparent">
      <v-list-item
        v-for="review in reviews"
        :key="review.id"
        :title="review.comment || 'Revisao tecnica'"
        :subtitle="`Solicitado por ${review.requestedBy}`"
      >
        <template #append>
          <BaseStatusBadge :kind="reviewBadgeKind(review.status)" size="x-small" />
        </template>
      </v-list-item>
      <v-list-item v-if="!loading && reviews.length === 0" title="Sem revisoes pendentes" />
    </v-list>
  </v-card>
</template>

<style scoped>
.side-panel {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
  margin-top: 10px;
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
