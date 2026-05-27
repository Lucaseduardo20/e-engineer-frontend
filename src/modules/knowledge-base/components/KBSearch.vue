<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import type { Project } from '@/shared/types/api-contracts'
import { getApiErrorMessage } from '@/shared/http/api-error'

const query = ref('')
const results = ref<Project[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const hasSearched = ref(false)

async function search() {
  loading.value = true
  error.value = null
  hasSearched.value = true

  try {
    const response = await apiClient.knowledgeBase.search({
      q: query.value || undefined,
      page: 1,
      pageSize: 5,
    })
    results.value = response.items
  } catch (searchError) {
    results.value = []
    error.value = getApiErrorMessage(searchError, 'Nao foi possivel buscar referencias agora.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="knowledge-panel" variant="flat" rounded="lg">
    <v-card-title class="knowledge-panel__title">
      <v-icon icon="$command" color="secondary" size="19" />
      Base de conhecimento
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="query"
        label="Buscar projetos de referencia"
        density="comfortable"
        variant="outlined"
        prepend-inner-icon="$search"
        hide-details
        clearable
        @keyup.enter="search"
      />
      <v-btn
        class="mt-3"
        color="teal"
        :loading="loading"
        block
        prepend-icon="$search"
        @click="search"
        >Buscar referencia</v-btn
      >

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ error }}
      </v-alert>
      <v-list v-if="results.length" class="mt-3" lines="two">
        <v-list-item
          v-for="project in results"
          :key="project.id"
          :title="project.name"
          :subtitle="project.description"
        >
          <template #prepend>
            <v-avatar color="teal" variant="tonal" size="32">
              <v-icon icon="$file" size="16" />
            </v-avatar>
          </template>
        </v-list-item>
      </v-list>
      <v-empty-state
        v-else-if="hasSearched && !loading && !error"
        class="mt-3"
        headline="Sem referencias"
        text="Nenhum projeto anterior encontrado."
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.knowledge-panel {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.knowledge-panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #d8e1de;
  color: #14231f;
  font-size: 1rem;
  font-weight: 850;
}
</style>
