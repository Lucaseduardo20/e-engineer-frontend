<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import { displayUserName } from '@/shared/formatters/user.formatter'
import type { Deliverable, User } from '@/shared/types/api-contracts'

const props = defineProps<{
  deliverables: Deliverable[]
  users?: User[]
}>()

const emit = defineEmits<{
  'update:status': [deliverable: Deliverable, status: Deliverable['status']]
}>()

const columns: Array<{ status: Deliverable['status']; title: string; color: string }> = [
  { status: 'todo', title: 'A produzir', color: 'blue-grey' },
  { status: 'in_progress', title: 'Em producao', color: 'blue' },
  { status: 'blocked', title: 'Bloqueados', color: 'red' },
  { status: 'done', title: 'Concluidos', color: 'green' },
]
const users = ref<User[]>([])
const draggedDeliverable = ref<Deliverable | null>(null)
const availableUsers = computed(() => (props.users?.length ? props.users : users.value))

onMounted(async () => {
  try {
    users.value = await apiClient.organizations.users()
  } catch {
    users.value = []
  }
})

function byStatus(status: Deliverable['status']) {
  return props.deliverables.filter((deliverable) => deliverable.status === status)
}

function userName(userId: string) {
  return displayUserName(userId, availableUsers.value)
}

function startDrag(deliverable: Deliverable) {
  draggedDeliverable.value = deliverable
}

function dropOn(status: Deliverable['status']) {
  if (!draggedDeliverable.value || draggedDeliverable.value.status === status) {
    draggedDeliverable.value = null
    return
  }

  emit('update:status', draggedDeliverable.value, status)
  draggedDeliverable.value = null
}
</script>

<template>
  <div class="deliverables-board">
    <v-card
      v-for="column in columns"
      :key="column.status"
      variant="flat"
      border
      rounded="lg"
      :class="['deliverables-board__column', `deliverables-board__column--${column.status}`]"
      @dragover.prevent
      @drop="dropOn(column.status)"
    >
      <v-card-title class="deliverables-board__column-title">
        <div>
          <span>{{ column.title }}</span>
          <small>Fluxo operacional</small>
        </div>
        <v-chip :color="column.color" size="small" variant="flat">
          {{ byStatus(column.status).length }}
        </v-chip>
      </v-card-title>

      <v-card-text class="d-grid ga-3">
        <v-sheet
          v-for="deliverable in byStatus(column.status)"
          :key="deliverable.id"
          border
          rounded="sm"
          class="deliverables-board__card"
          draggable="true"
          @dragstart="startDrag(deliverable)"
          @dragend="draggedDeliverable = null"
        >
          <div class="deliverables-board__card-head">
            <v-icon icon="$command" size="16" />
            <div>
              <strong>{{ deliverable.title }}</strong>
              <small>{{ deliverable.description || 'Sem descrição técnica.' }}</small>
            </div>
          </div>
          <div v-if="deliverable.tags?.length" class="deliverables-board__tags">
            <v-chip
              v-for="tag in deliverable.tags.slice(0, 3)"
              :key="tag.id"
              size="x-small"
              color="teal"
              variant="tonal"
            >
              {{ tag.name }}
            </v-chip>
            <v-chip v-if="deliverable.tags.length > 3" size="x-small" color="teal" variant="outlined">
              +{{ deliverable.tags.length - 3 }}
            </v-chip>
          </div>
          <div class="deliverables-board__assignees">
            <v-chip
              v-for="assignee in deliverable.assignees"
              :key="assignee"
              size="x-small"
              color="teal"
              variant="tonal"
            >
              {{ userName(assignee) }}
            </v-chip>
            <span v-if="deliverable.assignees.length === 0">Sem responsavel definido</span>
          </div>
          <div class="deliverables-board__meta">
            <span>{{
              deliverable.dueDate ? formatShortDate(deliverable.dueDate) : 'Sem prazo'
            }}</span>
            <v-btn
              :to="`/projects/${deliverable.projectId}/deliverables/${deliverable.id}/edit`"
              size="x-small"
              color="teal"
              variant="tonal"
            >
              Editar
            </v-btn>
          </div>
          <v-select
            :model-value="deliverable.status"
            :items="columns.map((item) => ({ title: item.title, value: item.status }))"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="emit('update:status', deliverable, $event)"
          />
        </v-sheet>

        <v-empty-state
          v-if="byStatus(column.status).length === 0"
          headline="Sem entregaveis"
          text="Nada nesta etapa agora."
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.deliverables-board {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.deliverables-board__column {
  min-height: 100%;
  overflow: hidden;
  border-color: #cfe3dc;
  background:
    linear-gradient(180deg, rgb(235 250 245 / 0.92), #ffffff 34%),
    #ffffff;
}

.deliverables-board__column--blocked {
  border-color: #f0c7c2;
  background:
    linear-gradient(180deg, rgb(255 238 235 / 0.95), #ffffff 34%),
    #ffffff;
}

.deliverables-board__column--done {
  border-color: #bee6cf;
  background:
    linear-gradient(180deg, rgb(232 249 239 / 0.95), #ffffff 34%),
    #ffffff;
}

.deliverables-board__column-title {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.75rem;
  color: #143b33;
  font-size: 0.95rem;
  font-weight: 850;
}

.deliverables-board__column-title small {
  display: block;
  color: #64736f;
  font-size: 0.72rem;
  font-weight: 600;
}

.deliverables-board__card {
  display: grid;
  gap: 0.55rem;
  border-color: #d7e4df;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.1), transparent 7rem),
    #ffffff;
  cursor: grab;
  padding: 0.7rem;
}

.deliverables-board__card:hover {
  border-color: #8ccbbd;
  box-shadow: 0 8px 20px rgb(15 45 38 / 0.08);
}

.deliverables-board__card-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.45rem;
  color: #123c32;
}

.deliverables-board__card-head strong {
  display: block;
  overflow-wrap: anywhere;
}

.deliverables-board__card-head small {
  display: -webkit-box;
  overflow: hidden;
  color: #64736f;
  font-size: 0.75rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.deliverables-board__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.deliverables-board__assignees {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: #63716d;
  font-size: 0.82rem;
}

.deliverables-board__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: #63716d;
  font-size: 0.78rem;
}

@media (max-width: 1180px) {
  .deliverables-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .deliverables-board {
    grid-template-columns: 1fr;
  }
}
</style>
