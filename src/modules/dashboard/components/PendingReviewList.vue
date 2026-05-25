<script setup lang="ts">
import BaseStatusChip from '@/shared/components/BaseStatusChip.vue'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import type { PendingReview } from '@/modules/dashboard/types/dashboard.types'

defineProps<{
  reviews: PendingReview[]
}>()
</script>

<template>
  <section class="pending-review-list" aria-labelledby="pending-review-list-title">
    <div class="pending-review-list__header">
      <div>
        <h2 id="pending-review-list-title">Revisoes aguardando aprovacao</h2>
        <p>Documentos que precisam de decisao tecnica para evitar retrabalho.</p>
      </div>
    </div>

    <div class="pending-review-list__items">
      <article v-for="review in reviews" :key="review.id" class="pending-review-list__item">
        <div>
          <h3>{{ review.documentName }}</h3>
          <p>{{ review.projectName }}</p>
        </div>

        <div class="pending-review-list__meta">
          <span>{{ review.reviewerName }}</span>
          <span>{{ formatShortDate(review.dueDate) }}</span>
          <BaseStatusChip :label="review.statusLabel" :tone="review.statusTone" />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.pending-review-list {
  display: grid;
  gap: 1rem;
  border: 1px solid #dce3e8;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 1rem;
}

.pending-review-list__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: #172033;
  font-size: 1.125rem;
}

.pending-review-list__header p,
.pending-review-list__item p {
  margin-top: 0.3rem;
  color: #667085;
  font-size: 0.875rem;
  line-height: 1.5;
}

.pending-review-list__items {
  display: grid;
  gap: 0.75rem;
}

.pending-review-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  border: 1px solid #edf0f3;
  border-radius: 0.5rem;
  padding: 0.875rem;
}

h3 {
  color: #253040;
  font-size: 0.95rem;
}

.pending-review-list__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  color: #667085;
  font-size: 0.8125rem;
  font-weight: 700;
}

@media (max-width: 760px) {
  .pending-review-list__item,
  .pending-review-list__meta {
    display: grid;
    justify-content: stretch;
  }
}
</style>
