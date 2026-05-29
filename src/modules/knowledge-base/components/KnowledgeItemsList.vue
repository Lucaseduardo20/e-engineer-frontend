<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import KnowledgeItemCard from './KnowledgeItemCard.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemStatus,
  type KnowledgeItemType,
} from '@/modules/knowledge-base/types/knowledge.types'

const store = useKnowledgeItemsStore()
const { items, total, page, pageSize, filters, isLoading, error } = storeToRefs(store)

const typeOptions = Object.entries(knowledgeTypeLabels).map(([value, title]) => ({ value, title }))
const statusOptions = Object.entries(knowledgeStatusLabels).map(([value, title]) => ({
  value,
  title,
}))

onMounted(() => {
  void store.listItems()
})

function applyFilters() {
  void store.listItems(1)
}

function updateType(value: KnowledgeItemType | null) {
  filters.value.type = value ?? undefined
  applyFilters()
}

function updateStatus(value: KnowledgeItemStatus | null) {
  filters.value.status = value ?? undefined
  applyFilters()
}
</script>

<template>
  <section class="knowledge-list">
    <div class="knowledge-list__toolbar">
      <v-text-field
        v-model="filters.searchQuery"
        label="Buscar conhecimento"
        density="comfortable"
        variant="outlined"
        prepend-inner-icon="$search"
        hide-details
        clearable
        @keyup.enter="store.searchItems(filters.searchQuery)"
      />
      <v-select
        :model-value="filters.type"
        :items="typeOptions"
        label="Tipo"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        @update:model-value="updateType"
      />
      <v-select
        :model-value="filters.status"
        :items="statusOptions"
        label="Status"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        @update:model-value="updateStatus"
      />
      <v-btn color="teal" variant="flat" prepend-icon="$search" @click="applyFilters">
        Buscar
      </v-btn>
      <v-btn to="/knowledge-base?new=1" color="teal" variant="tonal" prepend-icon="$success">
        Novo item
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="isLoading" indeterminate color="teal" class="mb-4" />

    <div v-if="items.length" class="knowledge-list__grid">
      <KnowledgeItemCard v-for="item in items" :key="item.id" :item="item" />
    </div>

    <v-empty-state
      v-else-if="!isLoading"
      headline="Base de conhecimento vazia"
      text="Crie um padrao tecnico, documento modelo, licao aprendida ou promova um projeto como referencia."
    />

    <v-pagination
      v-if="total > pageSize"
      class="mt-5"
      :model-value="page"
      :length="Math.ceil(total / pageSize)"
      rounded="circle"
      @update:model-value="store.listItems"
    />
  </section>
</template>

<style scoped>
.knowledge-list__toolbar {
  display: grid;
  grid-template-columns: minmax(16rem, 1fr) minmax(12rem, 0.55fr) minmax(10rem, 0.45fr) auto auto;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.knowledge-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1rem;
}

@media (max-width: 900px) {
  .knowledge-list__toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
