<script setup lang="ts">
import BasePagination from '@/shared/components/BasePagination.vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import type { Project } from '@/shared/types/api-contracts'
import { projectBadgeKind } from '@/shared/ui/status-badges'

withDefaults(
  defineProps<{
    projects: Project[]
    loading?: boolean
    page?: number
    pageSize?: number
    total?: number
  }>(),
  {
    page: 1,
    pageSize: 20,
    total: 0,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:status': [project: Project, status: Project['status']]
}>()

const statusOptions: Array<{ title: string; value: Project['status'] }> = [
  { title: 'Rascunho', value: 'draft' },
  { title: 'Ativo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Concluido', value: 'completed' },
  { title: 'Arquivado', value: 'archived' },
]

function visibleProjectTags(project: Project) {
  return (project.tags ?? []).slice(0, 3)
}
</script>

<template>
  <v-card class="projects-list" variant="flat" rounded="lg">
    <v-card-title class="projects-list__title">
      <div>
        <div class="projects-list__eyebrow">Carteira</div>
        <span>Projetos tecnicos</span>
      </div>
      <v-chip size="small" color="teal" variant="tonal">
        <v-icon icon="$file" start size="14" />
        {{ total || projects.length }}
      </v-chip>
    </v-card-title>

    <v-data-table
      :headers="[
        { title: 'Projeto', key: 'name' },
        { title: 'Status', key: 'status', width: 140 },
        { title: 'Progresso', key: 'progress', width: 180 },
        { title: '', key: 'actions', sortable: false, width: 92 },
      ]"
      :items="projects"
      :loading="loading"
      density="comfortable"
      hover
      item-value="id"
      hide-default-footer
      class="projects-list__table"
    >
      <template #loading>
        <v-skeleton-loader type="table-row@5" />
      </template>

      <template #no-data>
        <v-empty-state
          headline="Nenhum projeto tecnico"
          text="A carteira ainda nao possui projetos para os filtros atuais."
        />
      </template>

      <template #item.name="{ item }">
        <div class="projects-list__project py-3">
          <span class="projects-list__project-icon">
            <v-icon icon="$file" size="18" />
          </span>
          <div>
            <RouterLink class="project-link" :to="`/projects/${item.id}`">{{
              item.name
            }}</RouterLink>
            <div class="text-body-2 text-medium-emphasis">
              {{ item.description || 'Sem cliente informado' }}
            </div>
            <div v-if="visibleProjectTags(item).length" class="projects-list__tags">
              <v-chip
                v-for="tag in visibleProjectTags(item)"
                :key="tag.id"
                size="x-small"
                color="teal"
                variant="tonal"
              >
                {{ tag.name }}
              </v-chip>
            </div>
          </div>
        </div>
      </template>

      <template #item.status="{ item }">
        <v-select
          :model-value="item.status"
          :items="statusOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="projects-list__status-select"
          @update:model-value="emit('update:status', item, $event)"
        >
          <template #selection>
            <BaseStatusBadge :kind="projectBadgeKind(item.status)" />
          </template>
        </v-select>
      </template>

      <template #item.progress="{ item }">
        <div class="projects-list__progress">
          <v-progress-linear :model-value="item.progress" color="teal" height="9" rounded />
          <span>{{ item.progress }}%</span>
        </div>
      </template>

      <template #item.actions="{ item }">
        <v-btn :to="`/projects/${item.id}`" size="small" variant="tonal" color="teal" rounded="sm">
          Abrir
        </v-btn>
      </template>
    </v-data-table>

    <BasePagination
      :page="page"
      :page-size="pageSize"
      :total="total || projects.length"
      label="projetos"
      @update:page="emit('update:page', $event)"
    />
  </v-card>
</template>

<style scoped>
.projects-list {
  overflow: hidden;
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.projects-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d8e1de;
  padding: 1rem 1.125rem;
}

.projects-list__eyebrow {
  color: #65736f;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.projects-list__table {
  color: #263530;
}

.projects-list__project {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.projects-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.projects-list__project-icon {
  display: grid;
  flex: 0 0 auto;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #e8f5f0;
  color: #1d6f61;
}

.project-link {
  color: #123c32;
  font-weight: 800;
  text-decoration: none;
}

.project-link:hover {
  text-decoration: underline;
}

.projects-list__progress {
  display: grid;
  grid-template-columns: minmax(5rem, 1fr) 2.75rem;
  align-items: center;
  gap: 0.75rem;
  color: #51615d;
  font-size: 0.8rem;
  font-weight: 750;
}

.projects-list__status-select {
  width: 10.5rem;
}
</style>
