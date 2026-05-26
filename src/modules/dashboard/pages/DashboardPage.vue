<script setup lang="ts">
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import ActivityLogList from '@/modules/dashboard/components/ActivityLogList.vue'
import DashboardMetricCard from '@/modules/dashboard/components/DashboardMetricCard.vue'
import PendingReviewList from '@/modules/dashboard/components/PendingReviewList.vue'
import RecentProjectCard from '@/modules/dashboard/components/RecentProjectCard.vue'
import {
  activityLog,
  dashboardMetrics,
  pendingReviews,
  recentProjects,
} from '@/modules/dashboard/mocks/dashboard.mock'
</script>

<template>
  <div class="dashboard-page">
    <BasePageHeader
      eyebrow="Operacao tecnica"
      title="Dashboard"
      description="Acompanhe projetos, entregaveis, versoes oficiais e revisoes que precisam de decisao tecnica."
      :breadcrumbs="['E-Engineer', 'Dashboard']"
    >
      <template #actions>
        <button class="dashboard-page__secondary-action" type="button">Exportar resumo</button>
        <button class="dashboard-page__primary-action" type="button">Novo projeto</button>
      </template>
    </BasePageHeader>

    <section class="dashboard-page__metrics" aria-label="Indicadores principais">
      <DashboardMetricCard v-for="metric in dashboardMetrics" :key="metric.label" :metric="metric" />
    </section>

    <section class="dashboard-page__content-grid">
      <div class="dashboard-page__panel dashboard-page__panel--large">
        <div class="dashboard-page__section-header">
          <div>
            <h2>Projetos recentes</h2>
            <p>Projetos tecnicos em andamento com prazo, responsavel e status de producao.</p>
          </div>
        </div>

        <div class="dashboard-page__project-list">
          <RecentProjectCard v-for="project in recentProjects" :key="project.id" :project="project" />
        </div>
      </div>

      <ActivityLogList :items="activityLog" />
    </section>

    <PendingReviewList :reviews="pendingReviews" />
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 1.5rem;
}

.dashboard-page__primary-action,
.dashboard-page__secondary-action {
  min-height: 2.625rem;
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 800;
  padding: 0 1rem;
}

.dashboard-page__primary-action {
  border: 1px solid #1d6f61;
  background: #1d6f61;
  color: #ffffff;
}

.dashboard-page__secondary-action {
  border: 1px solid #cdd5df;
  background: #ffffff;
  color: #344054;
}

.dashboard-page__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-page__content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(22rem, 0.6fr);
  gap: 1rem;
}

.dashboard-page__panel {
  border: 1px solid #dce3e8;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 1rem;
}

.dashboard-page__section-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

h2,
p {
  margin: 0;
}

h2 {
  color: #172033;
  font-size: 1.125rem;
}

.dashboard-page__section-header p {
  margin-top: 0.3rem;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.5;
}

.dashboard-page__project-list {
  display: grid;
  gap: 0.875rem;
}

@media (max-width: 1180px) {
  .dashboard-page__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-page__content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-page__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
