<script setup lang="ts">
import { computed, ref } from 'vue'
import BasePagination from '@/shared/components/BasePagination.vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import { displayUserName } from '@/shared/formatters/user.formatter'
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
  'update:item-status': [deliverable: Deliverable, status: Deliverable['status']]
  'update:page': [page: number]
  'update:status': [status: Deliverable['status'] | null]
}>()

const statusModel = computed({
  get: () => props.status,
  set: (value) => emit('update:status', value),
})
const isFiltersOpen = ref(false)
const openCount = computed(() => props.deliverables.filter((item) => item.status !== 'done').length)
const blockedCount = computed(() => props.deliverables.filter((item) => item.status === 'blocked').length)
const withDueDateCount = computed(() => props.deliverables.filter((item) => Boolean(item.dueDate)).length)
const withTagsCount = computed(() => props.deliverables.filter((item) => (item.tags?.length ?? 0) > 0).length)

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
  return displayUserName(userId, props.users)
}

function tagSummary(deliverable: Deliverable) {
  const count = deliverable.tags?.length ?? deliverable.tagIds?.length ?? 0
  return count ? `${count} tag(s)` : 'Sem tags'
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
          size="small"
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros da tabela
        </v-btn>
        <v-btn color="teal" prepend-icon="$plus" @click="emit('create')">Novo entregavel</v-btn>
      </div>
    </v-card-title>

    <div class="deliverables-list__signals">
      <v-sheet rounded="lg" class="deliverables-list__signal deliverables-list__signal--primary">
        <span>Em operação</span>
        <strong>{{ openCount }}</strong>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverables-list__signal deliverables-list__signal--warning">
        <span>Bloqueados</span>
        <strong>{{ blockedCount }}</strong>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverables-list__signal">
        <span>Com prazo</span>
        <strong>{{ withDueDateCount }}/{{ deliverables.length }}</strong>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverables-list__signal deliverables-list__signal--intelligence">
        <span>Com tags</span>
        <strong>{{ withTagsCount }}/{{ deliverables.length }}</strong>
      </v-sheet>
    </div>

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
        { title: 'Inteligência', key: 'intelligence', width: 150 },
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
          </div>
        </div>
      </template>

      <template #item.type="{ item }">
        <span class="deliverables-list__type">{{ typeLabel(item.type) }}</span>
      </template>

      <template #item.intelligence="{ item }">
        <v-menu location="bottom" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              type="button"
              class="deliverables-list__tag-trigger"
              :class="{ 'deliverables-list__tag-trigger--empty': !(item.tags?.length) }"
            >
              <v-icon icon="$command" size="15" />
              <span>{{ tagSummary(item) }}</span>
            </button>
          </template>

          <v-sheet class="deliverables-list__tag-popover" rounded="lg" border>
            <div class="deliverables-list__tag-popover-head">
              <strong>Tags do entregável</strong>
              <span>Base para tracing, recomendação e raciocínio técnico.</span>
            </div>
            <div v-if="item.tags?.length" class="deliverables-list__tag-cloud">
              <v-chip
                v-for="tag in item.tags"
                :key="tag.id"
                size="small"
                color="teal"
                variant="tonal"
              >
                {{ tag.name }}
              </v-chip>
            </div>
            <v-alert v-else type="info" variant="tonal" density="compact">
              Nenhuma tag vinculada. Edite o entregável para alimentar a inteligência aplicada.
            </v-alert>
          </v-sheet>
        </v-menu>
      </template>

      <template #item.status="{ item }">
        <v-select
          :model-value="item.status"
          :items="statusOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="deliverables-list__status-select"
          @update:model-value="emit('update:item-status', item, $event)"
        >
          <template #selection>
            <BaseStatusBadge :kind="deliverableBadgeKind(item.status)" />
          </template>
        </v-select>
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

.deliverables-list__signals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  border-bottom: 1px solid #d8e1de;
  background:
    linear-gradient(135deg, #f4fbf8, #ffffff),
    #ffffff;
  padding: 0.9rem 1.125rem;
}

.deliverables-list__signal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid #d7e9e2;
  background: #ffffff;
  padding: 0.75rem;
}

.deliverables-list__signal span {
  color: #60716b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.deliverables-list__signal strong {
  color: #143d33;
  font-size: 1.25rem;
}

.deliverables-list__signal--primary {
  border-color: #9bd9cb;
  background: #effaf6;
}

.deliverables-list__signal--warning {
  border-color: #f0d08f;
  background: #fff8e8;
}

.deliverables-list__signal--intelligence {
  border-color: #9bd9cb;
  background:
    linear-gradient(135deg, #e7f8f2, #ffffff),
    #ffffff;
}

.deliverables-list__filter {
  width: 12rem;
}

.deliverables-list__status-select {
  width: 10.75rem;
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

.deliverables-list__tag-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #9bd9cb;
  border-radius: 999px;
  background: #effaf6;
  color: #126154;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.35rem 0.55rem;
}

.deliverables-list__tag-trigger--empty {
  border-color: #d7e4df;
  background: #f7faf9;
  color: #60716b;
}

.deliverables-list__tag-popover {
  display: grid;
  gap: 0.75rem;
  max-width: 22rem;
  border-color: #b9ddd2;
  background:
    linear-gradient(135deg, #f0fbf7, #ffffff 64%),
    #ffffff;
  padding: 0.9rem;
  box-shadow: 0 18px 42px rgb(15 45 38 / 0.14);
}

.deliverables-list__tag-popover-head {
  display: grid;
  gap: 0.15rem;
}

.deliverables-list__tag-popover-head strong {
  color: #143d33;
}

.deliverables-list__tag-popover-head span {
  color: #60716b;
  font-size: 0.86rem;
}

.deliverables-list__tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
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

  .deliverables-list__signals {
    grid-template-columns: 1fr;
  }
}
</style>
