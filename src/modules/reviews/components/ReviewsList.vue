<script setup lang="ts">
import BasePagination from '@/shared/components/BasePagination.vue'
import ReviewCard from '@/modules/reviews/components/ReviewCard.vue'
import type { ReviewSummary, User } from '@/shared/types/api-contracts'

withDefaults(
  defineProps<{
    reviews: ReviewSummary[]
    users?: User[]
    loading?: boolean
    saving?: boolean
    page?: number
    pageSize?: number
    total?: number
  }>(),
  {
    users: () => [],
    page: 1,
    pageSize: 20,
    total: 0,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  open: [review: ReviewSummary]
  approve: [review: ReviewSummary]
  reject: [review: ReviewSummary]
}>()
</script>

<template>
  <v-card class="reviews-list" variant="flat" rounded="lg">
    <v-card-title class="reviews-list__title">
      <div>
        <div class="reviews-list__eyebrow">Revisoes tecnicas</div>
        <span>Solicitacoes e decisoes</span>
      </div>
      <v-chip size="small" color="amber" variant="tonal">
        <v-icon icon="$search" start size="14" />
        {{ total || reviews.length }}
      </v-chip>
    </v-card-title>

    <div v-if="loading" class="reviews-list__grid">
      <v-skeleton-loader v-for="item in 6" :key="item" type="card" />
    </div>

    <v-empty-state
      v-else-if="reviews.length === 0"
      headline="Nenhuma revisao tecnica"
      text="As solicitacoes de revisao aparecerao aqui quando houver documentos para validar."
    />

    <div v-else class="reviews-list__grid">
      <ReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
        :users="users"
        :saving="saving"
        @open="emit('open', $event)"
        @approve="emit('approve', $event)"
        @reject="emit('reject', $event)"
      />
    </div>

    <BasePagination
      :page="page"
      :page-size="pageSize"
      :total="total || reviews.length"
      label="revisoes"
      @update:page="emit('update:page', $event)"
    />
  </v-card>
</template>

<style scoped>
.reviews-list {
  overflow: hidden;
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.reviews-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d8e1de;
  padding: 1rem 1.125rem;
}

.reviews-list__eyebrow {
  color: #65736f;
  font-size: 0.72rem;
  font-weight: 680;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reviews-list__grid {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 23rem), 1fr));
  padding: 1rem;
}
</style>
