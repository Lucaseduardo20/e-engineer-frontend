<script setup lang="ts">
import { onMounted } from 'vue'
import ProjectsList from '@/modules/projects/components/ProjectsList.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'

const projectsStore = useProjectsStore()

onMounted(() => {
  void projectsStore.loadProjects()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <p class="text-overline text-medium-emphasis mb-1">Carteira tecnica</p>
        <h1 class="text-h5">Projetos</h1>
      </div>
      <v-btn color="teal">Novo projeto</v-btn>
    </div>

    <v-alert v-if="projectsStore.error" type="error" variant="tonal" class="mb-4">
      {{ projectsStore.error }}
    </v-alert>

    <ProjectsList :projects="projectsStore.projects" :loading="projectsStore.isLoading" />
  </v-container>
</template>
