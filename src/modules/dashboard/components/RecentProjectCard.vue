<script setup lang="ts">
import BaseStatusChip from '@/shared/components/BaseStatusChip.vue'
import { formatRelativeDueDate, formatShortDate } from '@/shared/formatters/date.formatter'
import type { RecentProject } from '@/modules/dashboard/types/dashboard.types'

defineProps<{
  project: RecentProject
}>()
</script>

<template>
  <article class="recent-project-card">
    <div class="recent-project-card__header">
      <div>
        <h3>{{ project.name }}</h3>
        <p>{{ project.client }} · {{ project.type }}</p>
      </div>

      <BaseStatusChip :label="project.statusLabel" :tone="project.statusTone" />
    </div>

    <dl class="recent-project-card__meta">
      <div>
        <dt>Responsavel tecnico</dt>
        <dd>{{ project.responsibleEngineer }}</dd>
      </div>
      <div>
        <dt>Prazo</dt>
        <dd>{{ formatShortDate(project.dueDate) }} · {{ formatRelativeDueDate(project.dueDate) }}</dd>
      </div>
    </dl>

    <div class="recent-project-card__progress" :aria-label="`${project.progress}% concluido`">
      <span :style="{ width: `${project.progress}%` }" />
    </div>
  </article>
</template>

<style scoped>
.recent-project-card {
  display: grid;
  gap: 1rem;
  border: 1px solid #dce3e8;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 1rem;
}

.recent-project-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

h3 {
  margin: 0;
  color: #172033;
  font-size: 1rem;
  line-height: 1.35;
}

p {
  margin: 0.35rem 0 0;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.45;
}

.recent-project-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

dt {
  color: #667085;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 0.25rem 0 0;
  color: #253040;
  font-size: 0.875rem;
  font-weight: 700;
}

.recent-project-card__progress {
  overflow: hidden;
  height: 0.5rem;
  border-radius: 999px;
  background: #e5e9ef;
}

.recent-project-card__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #1d6f61;
}

@media (max-width: 720px) {
  .recent-project-card__header,
  .recent-project-card__meta {
    display: grid;
  }
}
</style>
