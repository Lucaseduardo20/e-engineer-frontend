<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReviewsStore } from '@/modules/reviews/stores/reviews.store'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { reviewBadgeKind } from '@/shared/ui/status-badges'

const props = defineProps<{
  projectId?: string
}>()

const reviewsStore = useReviewsStore()
const visibleReviews = computed(() => reviewsStore.reviews.slice(0, 5))

onMounted(async () => {
  await reviewsStore.loadLookups()
  await reviewsStore.loadReviews(1, {
    projectId: props.projectId,
    status: 'pending',
  })
})

function userName(userId: string) {
  return reviewsStore.reviewers.find((user) => user.id === userId)?.fullName ?? userId.slice(0, 8)
}
</script>

<template>
  <v-card class="side-panel" variant="flat" rounded="lg">
    <v-card-title class="side-panel__title">
      <v-icon icon="$search" color="amber" size="19" />
      Revisoes pendentes
      <v-spacer />
      <v-btn to="/reviews" size="small" variant="text" color="teal">Abrir</v-btn>
    </v-card-title>
    <v-progress-linear v-if="reviewsStore.isLoading" indeterminate color="amber" />
    <v-alert v-if="reviewsStore.error" type="error" variant="tonal" density="compact" class="ma-3">
      {{ reviewsStore.error }}
    </v-alert>
    <v-list v-else lines="two" bg-color="transparent">
      <v-list-item
        v-for="review in visibleReviews"
        :key="review.id"
        :title="review.comment || 'Revisao tecnica'"
        :subtitle="`Revisor: ${review.reviewers.map((item) => userName(item.userId)).join(', ')}`"
      >
        <template #append>
          <BaseStatusBadge :kind="reviewBadgeKind(review.status)" size="x-small" />
        </template>
      </v-list-item>
      <v-list-item
        v-if="!reviewsStore.isLoading && visibleReviews.length === 0"
        title="Sem revisoes pendentes"
      />
    </v-list>
  </v-card>
</template>

<style scoped>
.side-panel {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
  margin-top: 10px;
}

.side-panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #d8e1de;
  color: #14231f;
  font-size: 1rem;
  font-weight: 850;
}
</style>
