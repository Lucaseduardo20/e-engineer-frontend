<script setup lang="ts">
import type { Deliverable, Project } from '@/shared/types/api-contracts'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { projectBadgeKind } from '@/shared/ui/status-badges'
import DeliverablesBoard from './DeliverablesBoard.vue'

defineProps<{
  project: Project
  deliverables: Deliverable[]
}>()
</script>

<template>
  <div class="d-grid ga-4">
    <v-card variant="flat" border rounded="lg">
      <v-card-text>
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
          <div>
            <p class="text-overline text-medium-emphasis mb-1">Projeto tecnico</p>
            <div class="d-flex flex-wrap align-center ga-3">
              <h1 class="text-h5">{{ project.name }}</h1>
              <BaseStatusBadge :kind="projectBadgeKind(project.status)" />
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2">{{ project.description }}</p>
          </div>
          <div class="project-detail__actions">
            <v-progress-circular :model-value="project.progress" color="teal" size="72" width="8">
              {{ project.progress }}%
            </v-progress-circular>
            <v-btn
              :to="`/projects/${project.id}/deliverables`"
              color="teal"
              variant="tonal"
              prepend-icon="$calendar"
            >
              Gerenciar entregaveis
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <DeliverablesBoard :deliverables="deliverables" />
  </div>
</template>

<style scoped>
.project-detail__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 720px) {
  .project-detail__actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
