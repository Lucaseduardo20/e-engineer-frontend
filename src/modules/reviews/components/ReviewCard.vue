<script setup lang="ts">
import { computed } from 'vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import TraceableLinkButton from '@/shared/components/TraceableLinkButton.vue'
import { formatShortDate } from '@/shared/formatters/date.formatter'
import { displayUserName } from '@/shared/formatters/user.formatter'
import type { ReviewSummary, User } from '@/shared/types/api-contracts'
import { reviewBadgeKind } from '@/shared/ui/status-badges'

const props = defineProps<{
  review: ReviewSummary
  users?: User[]
  saving?: boolean
  canRegisterLesson?: boolean
  canDecideReview?: boolean
}>()

const emit = defineEmits<{
  open: [review: ReviewSummary]
  approve: [review: ReviewSummary]
  reject: [review: ReviewSummary]
  lesson: [review: ReviewSummary]
}>()

const canDecide = computed(
  () => props.review.status === 'pending' || props.review.status === 'overdue',
)

function userName(userId: string) {
  return displayUserName(userId, props.users)
}
</script>

<template>
  <v-card class="review-card" variant="flat" rounded="lg" @click="emit('open', review)">
    <div class="review-card__head">
      <span class="review-card__icon">
        <v-icon icon="$search" size="20" />
      </span>
      <div class="review-card__title">
        <h3>{{ review.comment || 'Revisao tecnica' }}</h3>
        <div class="review-card__entity-links">
          <v-tooltip text="Abrir projeto desta revisao">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                class="review-card__entity-link review-card__entity-link--project"
                :to="`/projects/${review.projectId}`"
                size="x-small"
                variant="tonal"
                color="teal"
                density="compact"
                @click.stop
              >
                Abrir projeto
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip v-if="review.documentId" text="Abrir documento desta revisao">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                class="review-card__entity-link review-card__entity-link--document"
                :to="`/documents?documentId=${review.documentId}`"
                size="x-small"
                variant="tonal"
                color="indigo"
                density="compact"
                @click.stop
              >
                Abrir documento
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
      <BaseStatusBadge :kind="reviewBadgeKind(review.status)" />
    </div>

    <div class="review-card__meta">
      <span>
        <v-icon icon="$calendar" size="15" />
        {{ review.dueDate ? formatShortDate(review.dueDate) : 'Sem prazo' }}
      </span>
      <span :class="{ 'review-card__meta--muted': !review.documentId }">
        <v-icon icon="$file" size="15" />
        {{ review.documentId ? 'Documento vinculado' : 'Sem documento' }}
      </span>
      <span>
        <v-icon icon="$success" size="15" />
        {{ review.reviewers.map((reviewer) => userName(reviewer.userId)).join(', ') }}
      </span>
    </div>

    <p v-if="review.decisionComment" class="review-card__decision">
      {{ review.decisionComment }}
    </p>

    <div class="review-card__actions">
      <v-btn
        size="small"
        color="teal"
        variant="tonal"
        prepend-icon="$search"
        @click.stop="emit('open', review)"
      >
        Abrir
      </v-btn>
      <v-btn
        v-if="review.status === 'rejected' && canRegisterLesson"
        size="small"
        color="indigo"
        variant="tonal"
        prepend-icon="$edit"
        @click.stop="emit('lesson', review)"
      >
        Registrar licao aprendida
      </v-btn>
      <v-btn
        v-if="canDecide && canDecideReview !== false"
        size="small"
        color="green"
        variant="tonal"
        prepend-icon="$complete"
        :loading="saving"
        @click.stop="emit('approve', review)"
      >
        Aprovar
      </v-btn>
      <v-btn
        v-if="canDecide && canDecideReview !== false"
        size="small"
        color="red"
        variant="tonal"
        prepend-icon="$error"
        :loading="saving"
        @click.stop="emit('reject', review)"
      >
        Rejeitar
      </v-btn>
      <TraceableLinkButton :path="`/reviews/${review.id}`" label="Copiar link da revisao" />
      <TraceableLinkButton :path="`/projects/${review.projectId}`" label="Copiar link do projeto" />
    </div>
  </v-card>
</template>

<style scoped>
.review-card {
  display: grid;
  gap: 0.875rem;
  border: 1px solid #d7e4df;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.05);
  cursor: pointer;
}

.review-card__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.review-card__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #fff6df;
  color: #9c6509;
}

.review-card__title {
  min-width: 0;
}

.review-card__title h3,
.review-card__decision {
  margin: 0;
}

.review-card__title h3 {
  overflow: hidden;
  color: #123c32;
  font-size: 1rem;
  font-weight: 680;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-card__meta,
.review-card__decision {
  color: #63716d;
  font-size: 0.84rem;
}

.review-card__entity-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.review-card__entity-link {
  min-width: 0;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}

.review-card__entity-link--project {
  background: #e6f6ef;
}

.review-card__entity-link--document {
  background: #eef2ff;
}

.review-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.review-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.review-card__meta--muted {
  color: #98a2b3;
}

.review-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
