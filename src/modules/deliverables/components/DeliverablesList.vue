<script setup lang="ts">
import { computed, ref } from 'vue'
import BasePagination from '@/shared/components/BasePagination.vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import type { Deliverable, DeliverableType, User } from '@/shared/types/api-contracts'
import { deliverableBadgeKind } from '@/shared/ui/status-badges'

const props = withDefaults(
  defineProps<{
    deliverables: Deliverable[]
    loading?: boolean
    page?: number
    pageSize?: number
    total?: number
    status?: Deliverable['status'] | null
    users?: User[]
  }>(),
  {
    loading: false,
    page: 1,
    pageSize: 12,
    total: 0,
    status: null,
    users: () => [],
  },
)

const emit = defineEmits<{
  create: []
  edit: [deliverable: Deliverable]
  'update:page': [page: number]
  'update:status': [status: Deliverable['status'] | null]
}>()

const statusModel = computed({
  get: () => props.status,
  set: (value) => emit('update:status', value),
})
const isFiltersOpen = ref(false)

const statusOptions: Array<{ title: string; value: Deliverable['status'] }> = [
  { title: 'A produzir', value: 'todo' },
  { title: 'Em producao', value: 'in_progress' },
  { title: 'Concluido', value: 'done' },
  { title: 'Bloqueado', value: 'blocked' },
]

const typeLabels: Record<DeliverableType, string> = {
  technical_survey: 'Levantamento tecnico',
  architectural_project: 'Projeto arquitetonico',
  structural_project: 'Projeto estrutural',
  electrical_project: 'Projeto eletrico',
  hydraulic_project: 'Projeto hidraulico',
  drainage_project: 'Projeto de drenagem',
  paving_project: 'Projeto de pavimentacao',
  landscaping_project: 'Projeto paisagistico',
  lighting_project: 'Projeto de iluminacao',
  descriptive_memorial: 'Memorial descritivo',
  budget: 'Orcamento',
  schedule: 'Cronograma',
  art_rrt: 'ART/RRT',
  photographic_report: 'Relatorio fotografico',
  technical_report: 'Relatorio tecnico',
  other: 'Outro',
}

function typeLabel(type?: DeliverableType) {
  return type ? typeLabels[type] : 'Entregavel tecnico'
}

function userName(userId: string) {
  return props.users.find((user) => user.id === userId)?.fullName ?? userId
}
</script>

<template>
  <v-card class="deliverables-list" variant="flat" rounded="lg">
    <v-card-title class="deliverables-list__title">
      <div>
        <div class="deliverables-list__eyebrow">Entregaveis do projeto</div>
        <span>Pacote tecnico</span>
      </div>
      <div class="deliverables-list__actions">
        <v-btn
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros
        </v-btn>
        <v-btn color="teal" prepend-icon="$plus" @click="emit('create')">Novo entregavel</v-btn>
      </div>
    </v-card-title>

    <v-expand-transition>
      <div v-if="isFiltersOpen" class="deliverables-list__filters">
        <v-select
          v-model="statusModel"
          :items="statusOptions"
          label="Status"
          density="comfortable"
          variant="outlined"
          hide-details
          clearable
          class="deliverables-list__filter"
        />
      </div>
    </v-expand-transition>

    <v-data-table
      :headers="[
        { title: 'Entregavel', key: 'title' },
        { title: 'Tipo', key: 'type', width: 190 },
        { title: 'Status', key: 'status', width: 150 },
        { title: 'Prazo', key: 'dueDate', width: 130 },
        { title: '', key: 'actions', sortable: false, width: 96 },
      ]"
      :items="deliverables"
      :loading="loading"
      density="comfortable"
      hover
      item-value="id"
      hide-default-footer
      class="deliverables-list__table"
    >
      <template #loading>
        <v-skeleton-loader type="table-row@5" />
      </template>

      <template #no-data>
        <v-empty-state
          headline="Nenhum entregavel"
          text="Este projeto ainda nao possui entregaveis para o filtro atual."
        />
      </template>

      <template #item.title="{ item }">
        <div class="deliverables-list__item py-3">
          <span class="deliverables-list__icon">
            <v-icon icon="$file" size="18" />
          </span>
          <div>
            <strong>{{ item.title }}</strong>
            <div class="deliverables-list__assignees">
              <v-chip
                v-for="assignee in item.assignees"
                :key="assignee"
                size="x-small"
                variant="tonal"
                color="teal"
              >
                {{ userName(assignee) }}
              </v-chip>
              <span v-if="item.assignees.length === 0">Sem responsavel definido</span>
            </div>
            <div v-if="item.description" class="text-caption text-medium-emphasis">
              {{ item.description }}
            </div>
          </div>
        </div>
      </template>

      <template #item.type="{ item }">
        <span class="deliverables-list__type">{{ typeLabel(item.type) }}</span>
      </template>

      <template #item.status="{ item }">
        <BaseStatusBadge :kind="deliverableBadgeKind(item.status)" />
      </template>

      <template #item.dueDate="{ item }">
        <span>{{ item.dueDate ? formatShortDate(item.dueDate) : 'Sem prazo' }}</span>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          size="small"
          variant="tonal"
          color="teal"
          rounded="sm"
          prepend-icon="$edit"
          @click="emit('edit', item)"
        >
          Editar
        </v-btn>
      </template>
    </v-data-table>

    <BasePagination
      :page="page"
      :page-size="pageSize"
      :total="total || deliverables.length"
      label="entregaveis"
      @update:page="emit('update:page', $event)"
    />
  </v-card>
</template>

<style scoped>
.deliverables-list {
  overflow: hidden;
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.deliverables-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d8e1de;
  padding: 1rem 1.125rem;
}

.deliverables-list__eyebrow {
  color: #65736f;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.deliverables-list__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.deliverables-list__filters {
  border-bottom: 1px solid #d8e1de;
  padding: 0.875rem 1.125rem;
}

.deliverables-list__filter {
  width: 12rem;
}

.deliverables-list__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.deliverables-list__icon {
  display: grid;
  flex: 0 0 auto;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #e8f5f0;
  color: #1d6f61;
}

.deliverables-list__type {
  color: #34443f;
  font-size: 0.86rem;
  font-weight: 700;
}

.deliverables-list__assignees {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
  color: #63716d;
  font-size: 0.82rem;
}

@media (max-width: 820px) {
  .deliverables-list__title,
  .deliverables-list__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .deliverables-list__filter {
    width: 100%;
  }
}
</style>
