<script setup lang="ts">
import BaseStatusChip from '@/shared/components/BaseStatusChip.vue'
import type { ActivityLogItem } from '@/modules/dashboard/types/dashboard.types'

defineProps<{
  items: ActivityLogItem[]
}>()
</script>

<template>
  <section class="activity-log-list" aria-labelledby="activity-log-list-title">
    <div>
      <h2 id="activity-log-list-title">Ultimos eventos</h2>
      <p>Rastro recente de versoes, revisoes e referencias usadas.</p>
    </div>

    <ol>
      <li v-for="item in items" :key="item.id">
        <BaseStatusChip :label="item.tone" :tone="item.tone" />
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.activity-log-list {
  display: grid;
  gap: 1rem;
  border: 1px solid #dce3e8;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 1rem;
}

h2,
h3,
p,
ol {
  margin: 0;
}

h2 {
  color: #172033;
  font-size: 1.125rem;
}

.activity-log-list > div > p {
  margin-top: 0.3rem;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.5;
}

ol {
  display: grid;
  gap: 0.875rem;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: flex-start;
  gap: 0.75rem;
}

h3 {
  color: #253040;
  font-size: 0.95rem;
}

li p {
  margin-top: 0.25rem;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
