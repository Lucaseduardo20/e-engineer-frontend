<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import type { Deliverable, User } from '@/shared/types/api-contracts'

const props = defineProps<{
  deliverables: Deliverable[]
}>()

const columns: Array<{ status: Deliverable['status']; title: string; color: string }> = [
  { status: 'todo', title: 'A produzir', color: 'blue-grey' },
  { status: 'in_progress', title: 'Em producao', color: 'blue' },
  { status: 'blocked', title: 'Bloqueados', color: 'red' },
  { status: 'done', title: 'Concluidos', color: 'green' },
]
const users = ref<User[]>([])

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
  return users.value.find((user) => user.id === userId)?.fullName ?? userId
}
</script>

<template>
  <div class="deliverables-board">
    <v-card v-for="column in columns" :key="column.status" variant="flat" border rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between text-subtitle-1">
        <span>{{ column.title }}</span>
        <v-chip :color="column.color" size="small" variant="tonal">{{
          byStatus(column.status).length
        }}</v-chip>
      </v-card-title>

      <v-card-text class="d-grid ga-3">
        <v-sheet
          v-for="deliverable in byStatus(column.status)"
          :key="deliverable.id"
          border
          rounded="sm"
          class="deliverables-board__card"
          draggable="true"
        >
          <div class="deliverables-board__card-head">
            <v-icon icon="$command" size="16" />
            <strong>{{ deliverable.title }}</strong>
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
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.deliverables-board__card {
  display: grid;
  gap: 0.65rem;
  border-color: #d7e4df;
  background: #ffffff;
  cursor: grab;
  padding: 0.8rem;
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
  overflow-wrap: anywhere;
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
