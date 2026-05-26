<script setup lang="ts">
import type { Deliverable } from '@/shared/types/api-contracts'

const props = defineProps<{
  deliverables: Deliverable[]
}>()

const columns: Array<{ status: Deliverable['status']; title: string; color: string }> = [
  { status: 'todo', title: 'A produzir', color: 'blue-grey' },
  { status: 'in_progress', title: 'Em producao', color: 'blue' },
  { status: 'blocked', title: 'Bloqueados', color: 'red' },
  { status: 'done', title: 'Concluidos', color: 'green' },
]

function byStatus(status: Deliverable['status']) {
  return props.deliverables.filter((deliverable) => deliverable.status === status)
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
          rounded="lg"
          class="pa-3"
        >
          <strong>{{ deliverable.title }}</strong>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ deliverable.assignees.join(', ') || 'Sem responsavel definido' }}
          </div>
          <div v-if="deliverable.dueDate" class="text-caption text-medium-emphasis mt-2">
            Prazo: {{ deliverable.dueDate }}
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
