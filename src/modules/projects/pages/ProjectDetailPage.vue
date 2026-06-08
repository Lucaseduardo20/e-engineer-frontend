<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectDetail from '@/modules/projects/components/ProjectDetail.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import { apiClient } from '@/shared/http/api-client'
import type { Deliverable } from '@/shared/types/api-contracts'

const route = useRoute()
const projectsStore = useProjectsStore()

onMounted(() => {
  void projectsStore.loadProjectDetail(String(route.params.id))
})

async function updateDeliverableStatus(deliverable: Deliverable, status: Deliverable['status']) {
  if (deliverable.status === status) {
    return
  }

  await apiClient.deliverables.update(deliverable.id, { status })
  await projectsStore.loadProjectDetail(String(route.params.id))
}
</script>

<template>
  <v-container fluid class="pa-0">
    <v-btn to="/projects" variant="text" class="mb-3">Voltar para projetos</v-btn>

    <v-alert v-if="projectsStore.error" type="error" variant="tonal" class="mb-4">
      {{ projectsStore.error }}
    </v-alert>

    <v-skeleton-loader
      v-if="projectsStore.isLoading && !projectsStore.selectedProject"
      type="article"
    />
    <ProjectDetail
      v-else-if="projectsStore.selectedProject"
      :project="projectsStore.selectedProject"
      :deliverables="projectsStore.deliverables"
      :documents="projectsStore.documents"
      :reviews="projectsStore.reviews"
      :knowledge-items="projectsStore.projectKnowledge"
      :audit-logs="projectsStore.auditLogs"
      @update:deliverable-status="updateDeliverableStatus"
    />
  </v-container>
</template>
