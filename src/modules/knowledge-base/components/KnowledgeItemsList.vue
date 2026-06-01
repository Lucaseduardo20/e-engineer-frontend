<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

const typeOptions = Object.entries(knowledgeTypeLabels)
  .filter(([value]) => !['zoning_rule_reference', 'project_template'].includes(value))
  .map(([value, title]) => ({ value, title }))
const statusOptions = Object.entries(knowledgeStatusLabels).map(([value, title]) => ({
  value,
  title,
}))

const hasAnyFilter = computed(
  () =>
    !!filters.value.searchQuery.trim() ||
    !!filters.value.type ||
    !!filters.value.status ||
    filters.value.includeArchived,
)

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
        label="Buscar"
        placeholder="Buscar padroes, modelos, referencias ou licoes aprendidas..."
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
        label="Todos os tipos"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        @update:model-value="updateType"
      />
      <v-select
        :model-value="filters.status"
        :items="statusOptions"
        label="Todos os status"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        @update:model-value="updateStatus"
      />
      <v-checkbox
        v-model="filters.includeArchived"
        label="Incluir arquivados"
        density="comfortable"
        hide-details
        @update:model-value="applyFilters"
      />
      <v-btn color="teal" variant="flat" prepend-icon="$search" @click="applyFilters">Buscar</v-btn>
      <v-btn to="/knowledge-base?new=1" color="teal" variant="tonal" prepend-icon="$success">
        Novo item
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="isLoading" indeterminate color="teal" class="mb-4" />

    <v-alert type="info" variant="tonal" class="mb-4">
      Itens publicados representam conhecimento oficial da organizacao. Itens obsoletos continuam
      visiveis como historico, mas nao sao recomendados para novos projetos.
    </v-alert>

    <div v-if="items.length" class="knowledge-list__grid">
      <KnowledgeItemCard v-for="item in items" :key="item.id" :item="item" />
    </div>

    <v-empty-state
      v-else-if="!isLoading && !hasAnyFilter"
      headline="Sua base de conhecimento ainda esta vazia"
      text="Registre padroes tecnicos, documentos modelo, projetos de referencia e licoes aprendidas para reutilizar em novos projetos."
    />

    <v-empty-state
      v-else-if="!isLoading"
      headline="Nenhum item encontrado"
      text="Tente ajustar a busca ou remover alguns filtros."
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
  grid-template-columns: minmax(16rem, 1fr) minmax(12rem, 0.55fr) minmax(10rem, 0.45fr) auto auto auto;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.knowledge-list__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 900px) {
  .knowledge-list__toolbar {
    grid-template-columns: 1fr;
  }

  .knowledge-list__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .knowledge-list__grid {
    grid-template-columns: 1fr;
  }
}
</style>
