<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import KnowledgeItemCard from './KnowledgeItemCard.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemStatus,
  type KnowledgeItemType,
} from '@/modules/knowledge-base/types/knowledge.types'

const store = useKnowledgeItemsStore()
const auth = useAuthStore()
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
      <div class="knowledge-list__filters">
        <v-text-field
          v-model="filters.searchQuery"
          class="knowledge-list__search"
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
          class="knowledge-list__archive-toggle"
          label="Incluir arquivados"
          density="comfortable"
          hide-details
          @update:model-value="applyFilters"
        />
      </div>
      <div class="knowledge-list__actions">
        <v-btn color="teal" variant="flat" prepend-icon="$search" @click="applyFilters">Buscar</v-btn>
        <v-btn
          v-if="auth.can('knowledge.create')"
          to="/knowledge-base?new=1"
          color="teal"
          variant="tonal"
          prepend-icon="$success"
        >
          Novo item
        </v-btn>
      </div>
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
  gap: 0.85rem;
  margin-bottom: 1rem;
  border: 1px solid #cfe5de;
  border-radius: 0.75rem;
  background: #fbfffd;
  padding: 0.85rem;
}

.knowledge-list__filters {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  min-width: 0;
}

.knowledge-list__search,
.knowledge-list__filters :deep(.v-field),
.knowledge-list__filters :deep(.v-selection-control) {
  min-width: 0;
}

.knowledge-list__archive-toggle {
  align-self: center;
}

.knowledge-list__archive-toggle :deep(.v-label) {
  white-space: normal;
  overflow-wrap: anywhere;
}

.knowledge-list__actions {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 1fr;
}

.knowledge-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}

@media (min-width: 680px) {
  .knowledge-list__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .knowledge-list__search {
    grid-column: 1 / -1;
  }

  .knowledge-list__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

@media (min-width: 1100px) {
  .knowledge-list__toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .knowledge-list__filters {
    grid-template-columns: minmax(18rem, 1fr) minmax(11rem, 0.55fr) minmax(10rem, 0.5fr) minmax(9rem, auto);
  }

  .knowledge-list__search {
    grid-column: auto;
  }
}
</style>
