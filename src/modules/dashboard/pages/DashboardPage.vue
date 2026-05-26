<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AdminUsers from '@/modules/admin/components/AdminUsers.vue'
import DashboardMetricTile from '@/modules/dashboard/components/DashboardMetricTile.vue'
import KBSearch from '@/modules/knowledge-base/components/KBSearch.vue'
import NotificationsFeed from '@/modules/notifications/components/NotificationsFeed.vue'
import ProjectsList from '@/modules/projects/components/ProjectsList.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import ReviewsPanel from '@/modules/reviews/components/ReviewsPanel.vue'

const projectsStore = useProjectsStore()

const metrics = computed(() => [
  {
    label: 'Projetos ativos',
    value: projectsStore.activeProjects.length,
    hint: 'Projetos tecnicos em producao',
    icon: '$success',
    color: '#1d7f5f',
    trend: 8,
    chart: [32, 44, 38, 58, 64, 72],
  },
  {
    label: 'Progresso medio',
    value: projectsStore.projects.length
      ? `${Math.round(
          projectsStore.projects.reduce((total, project) => total + project.progress, 0) /
            projectsStore.projects.length,
        )}%`
      : '0%',
    hint: 'Baseado na carteira atual',
    icon: '$loading',
    color: '#2447a8',
    trend: 5,
    chart: [28, 36, 42, 48, 56, 62],
  },
  {
    label: 'Carteira',
    value: projectsStore.total,
    hint: 'Projetos vinculados a organizacao',
    icon: '$file',
    color: '#b7791f',
    trend: 12,
    chart: [24, 34, 44, 40, 52, 68],
  },
])

onMounted(() => {
  void projectsStore.loadProjects()
})
</script>

<template>
  <v-container fluid class="dashboard-page pa-0">
    <div class="dashboard-page__header">
      <div>
        <p class="dashboard-page__eyebrow">Operacao tecnica</p>
        <h1>Dashboard</h1>
        <p>Acompanhe projetos, entregaveis, documentos oficiais e revisoes que exigem decisao.</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" prepend-icon="$file">Exportar resumo</v-btn>
        <v-btn color="teal" to="/projects" prepend-icon="$plus">Novo projeto</v-btn>
      </div>
    </div>

    <v-row class="mt-1">
      <v-col v-for="metric in metrics" :key="metric.label" cols="12" md="4">
        <DashboardMetricTile v-bind="metric" />
      </v-col>
    </v-row>

    <v-alert v-if="projectsStore.error" type="error" variant="tonal" class="my-4">
      {{ projectsStore.error }}
    </v-alert>

    <v-row class="mt-1">
      <v-col cols="12" lg="8">
        <ProjectsList
          :projects="projectsStore.projects"
          :loading="projectsStore.isLoading"
          :page="projectsStore.page"
          :page-size="projectsStore.pageSize"
          :total="projectsStore.total"
          @update:page="projectsStore.loadProjects"
        />
      </v-col>
      <v-col cols="12" lg="4" class="d-grid ga-4">
        <NotificationsFeed />
        <ReviewsPanel />
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="6">
        <KBSearch />
      </v-col>
      <v-col cols="12" md="6">
        <AdminUsers />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 1.15rem;
}

.dashboard-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #d7e4df;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgb(18 60 50 / 0.94), rgb(36 71 168 / 0.86)), #123c32;
  box-shadow: 0 18px 34px rgb(15 45 38 / 0.1);
  color: #ffffff;
  padding: 1.35rem;
}

.dashboard-page__header h1,
.dashboard-page__header p {
  margin: 0;
}

.dashboard-page__header h1 {
  font-size: clamp(1.8rem, 4vw, 2.35rem);
  font-weight: 850;
  letter-spacing: 0;
}

.dashboard-page__header p:not(.dashboard-page__eyebrow) {
  max-width: 46rem;
  margin-top: 0.4rem;
  color: rgb(255 255 255 / 0.78);
}

.dashboard-page__eyebrow {
  margin-bottom: 0.25rem;
  color: #bdebdc;
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .dashboard-page__header {
    display: grid;
  }
}
</style>
