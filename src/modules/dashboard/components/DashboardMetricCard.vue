<script setup lang="ts">
import BaseStatusChip from '@/shared/components/BaseStatusChip.vue'
import type { DashboardMetric } from '@/modules/dashboard/types/dashboard.types'

defineProps<{
  metric: DashboardMetric
}>()

const metricToneLabels: Record<DashboardMetric['tone'], string> = {
  neutral: 'Neutro',
  info: 'Monitorar',
  success: 'Em ordem',
  warning: 'Atencao',
  danger: 'Critico',
}
</script>

<template>
  <article class="dashboard-metric-card">
    <div class="dashboard-metric-card__header">
      <span>{{ metric.label }}</span>
      <BaseStatusChip :label="metricToneLabels[metric.tone]" :tone="metric.tone" />
    </div>

    <strong>{{ metric.value }}</strong>
    <p>{{ metric.supportingText }}</p>
  </article>
</template>

<style scoped>
.dashboard-metric-card {
  display: grid;
  min-height: 11rem;
  align-content: space-between;
  gap: 1rem;
  border: 1px solid #dce3e8;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(16 24 40 / 0.05);
}

.dashboard-metric-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  color: #5f6b7a;
  font-size: 0.875rem;
  font-weight: 800;
}

strong {
  color: #172033;
  font-size: 2.25rem;
  line-height: 1;
}

p {
  margin: 0;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
