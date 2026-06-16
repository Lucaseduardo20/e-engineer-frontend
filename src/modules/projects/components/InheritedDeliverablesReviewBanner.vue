<script setup lang="ts">
import { computed } from 'vue'
import type { Deliverable } from '@/shared/types/api-contracts'

const props = defineProps<{
  projectId: string
  deliverables: Deliverable[]
  canApproveRemoval?: boolean
  savingIds?: string[]
}>()

const emit = defineEmits<{
  markReviewed: [deliverable: Deliverable]
  requestRemoval: [deliverable: Deliverable]
  approveRemoval: [deliverable: Deliverable]
  rejectRemoval: [deliverable: Deliverable]
}>()

const inheritedDeliverables = computed(() =>
  props.deliverables.filter((deliverable) => Boolean(deliverable.inheritanceReview)),
)
const pendingDeliverables = computed(() =>
  inheritedDeliverables.value.filter(
    (deliverable) => deliverable.inheritanceReview?.needsReviewAfterInheritance,
  ),
)
const reviewedCount = computed(() => inheritedDeliverables.value.length - pendingDeliverables.value.length)
const progress = computed(() => {
  if (!inheritedDeliverables.value.length) return 100
  return Math.round((reviewedCount.value / inheritedDeliverables.value.length) * 100)
})

function isSaving(deliverable: Deliverable) {
  return props.savingIds?.includes(deliverable.id) ?? false
}
</script>

<template>
  <v-sheet
    v-if="pendingDeliverables.length"
    border
    rounded="lg"
    class="inherited-review"
  >
    <div class="inherited-review__head">
      <div>
        <span>Revisao tecnica inicial</span>
        <h2>Revise os entregaveis herdados</h2>
        <p>
          Confirme o que faz sentido para este projeto antes de iniciar a execucao.
          A base acelera o trabalho, mas a decisao tecnica continua com a equipe.
        </p>
      </div>
      <div class="inherited-review__progress">
        <v-progress-circular :model-value="progress" color="teal" size="72" width="8">
          {{ progress }}%
        </v-progress-circular>
        <small>{{ pendingDeliverables.length }} pendente(s)</small>
      </div>
    </div>

    <div class="inherited-review__list">
      <div
        v-for="deliverable in pendingDeliverables"
        :key="deliverable.id"
        class="inherited-review__item"
      >
        <div class="inherited-review__item-copy">
          <strong>{{ deliverable.title }}</strong>
          <small>{{ deliverable.type || 'Entregavel tecnico' }} · {{ deliverable.status }}</small>
          <div class="inherited-review__tags">
            <v-chip
              v-if="deliverable.removalRequest?.status === 'requested'"
              size="x-small"
              color="amber"
              variant="tonal"
            >
              Remocao aguardando aprovacao
            </v-chip>
            <v-chip
              v-for="tag in (deliverable.tags ?? []).slice(0, 4)"
              :key="tag.id"
              size="x-small"
              color="teal"
              variant="tonal"
            >
              {{ tag.name }}
            </v-chip>
            <small v-if="!(deliverable.tags ?? []).length">Sem tags tecnicas</small>
          </div>
        </div>
        <div class="inherited-review__actions">
          <v-btn
            size="small"
            color="teal"
            variant="flat"
            :loading="isSaving(deliverable)"
            @click="emit('markReviewed', deliverable)"
          >
            Marcar revisado
          </v-btn>
          <v-btn
            size="small"
            color="indigo"
            variant="tonal"
            :to="`/projects/${projectId}/deliverables/${deliverable.id}/edit`"
          >
            Editar
          </v-btn>
          <v-btn
            size="small"
            color="teal"
            variant="tonal"
            :to="`/projects/${projectId}/deliverables/${deliverable.id}/edit`"
          >
            Ajustar tags
          </v-btn>
          <v-btn
            size="small"
            color="red"
            variant="tonal"
            :disabled="Boolean(deliverable.removalRequest)"
            :loading="isSaving(deliverable)"
            @click="emit('requestRemoval', deliverable)"
          >
            Solicitar remocao
          </v-btn>
          <v-btn
            v-if="deliverable.removalRequest?.status === 'requested' && canApproveRemoval"
            size="small"
            color="red"
            variant="flat"
            :loading="isSaving(deliverable)"
            @click="emit('approveRemoval', deliverable)"
          >
            Aprovar
          </v-btn>
          <v-btn
            v-if="deliverable.removalRequest?.status === 'requested' && canApproveRemoval"
            size="small"
            color="blue-grey"
            variant="tonal"
            :loading="isSaving(deliverable)"
            @click="emit('rejectRemoval', deliverable)"
          >
            Rejeitar
          </v-btn>
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<style scoped>
.inherited-review {
  display: grid;
  gap: 1rem;
  border-color: #b8ddd2;
  background: #f6fffb;
  padding: 1rem;
}

.inherited-review__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.inherited-review__head span {
  color: #267365;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.inherited-review__head h2,
.inherited-review__head p {
  margin: 0.2rem 0 0;
}

.inherited-review__head p,
.inherited-review__item-copy small,
.inherited-review__progress small {
  color: #60716b;
}

.inherited-review__progress {
  display: grid;
  justify-items: center;
  gap: 0.35rem;
}

.inherited-review__list {
  display: grid;
  gap: 0.65rem;
}

.inherited-review__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  border: 1px solid #d4e8e1;
  border-radius: 0.55rem;
  background: #ffffff;
  padding: 0.75rem;
}

.inherited-review__item-copy {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.inherited-review__item-copy strong {
  overflow-wrap: anywhere;
}

.inherited-review__tags,
.inherited-review__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.inherited-review__actions {
  justify-content: flex-end;
}

@media (max-width: 840px) {
  .inherited-review__head,
  .inherited-review__item {
    grid-template-columns: 1fr;
    display: grid;
  }

  .inherited-review__progress,
  .inherited-review__actions {
    justify-content: flex-start;
    justify-items: flex-start;
  }
}
</style>
