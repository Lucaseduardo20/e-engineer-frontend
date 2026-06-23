<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import TraceableLinkButton from '@/shared/components/TraceableLinkButton.vue'
import { formatDateTime, formatShortDate } from '@/shared/formatters/date.formatter'
import { displayUserName } from '@/shared/formatters/user.formatter'
import type { ReviewDetail, ReviewSummary, User } from '@/shared/types/api-contracts'
import { reviewBadgeKind } from '@/shared/ui/status-badges'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    review?: ReviewDetail | null
    users?: User[]
    saving?: boolean
  }>(),
  {
    review: null,
    users: () => [],
    saving: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  comment: [body: string]
  approve: [review: ReviewSummary]
  reject: [review: ReviewSummary]
}>()

const commentBody = ref('')
const canDecide = computed(
  () => props.review?.status === 'pending' || props.review?.status === 'overdue',
)
const reviewPath = computed(() => (props.review ? `/reviews/${props.review.id}` : '/reviews'))

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      commentBody.value = ''
    }
  },
)

function userName(userId?: string | null) {
  if (!userId) {
    return 'Nao informado'
  }

  return displayUserName(userId, props.users, 'Nao informado')
}

function submitComment() {
  const body = commentBody.value.trim()

  if (!body) {
    return
  }

  emit('comment', body)
  commentBody.value = ''
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="920"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="review-detail" rounded="lg">
      <v-card-title class="review-detail__title">
        <div>
          <span>Revisao tecnica</span>
          <p>{{ review?.comment || 'Sem descricao principal' }}</p>
        </div>
        <BaseStatusBadge v-if="review" :kind="reviewBadgeKind(review.status)" />
      </v-card-title>

      <v-card-text v-if="review" class="review-detail__body">
        <section class="review-detail__summary">
          <div>
            <span>Solicitante</span>
            <strong>{{ userName(review.requestedBy) }}</strong>
          </div>
          <div>
            <span>Prazo</span>
            <strong>{{ review.dueDate ? formatShortDate(review.dueDate) : 'Sem prazo' }}</strong>
          </div>
          <div>
            <span>Atualizacao</span>
            <strong>{{
              review.updatedAt ? formatDateTime(review.updatedAt) : 'Sem registro'
            }}</strong>
          </div>
          <div>
            <span>Decisor</span>
            <strong>{{ userName(review.reviewedBy) }}</strong>
          </div>
        </section>

        <section class="review-detail__links">
          <TraceableLinkButton :path="reviewPath" label="Link da revisao" />
          <TraceableLinkButton :path="`/projects/${review.projectId}`" label="Link do projeto" />
          <TraceableLinkButton
            v-if="review.documentId"
            :path="`/documents?documentId=${review.documentId}`"
            label="Link do documento"
          />
        </section>

        <section class="review-detail__section">
          <h3>Contexto tecnico</h3>
          <p>{{ review.comment || 'A revisao nao possui contexto descritivo.' }}</p>
          <dl>
            <div>
              <dt>Projeto</dt>
              <dd>
                <v-tooltip text="Abrir a tela do projeto relacionado">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      :to="`/projects/${review.projectId}`"
                      color="teal"
                      variant="tonal"
                      size="small"
                      density="compact"
                      class="review-detail__entity-link review-detail__entity-link--project"
                    >
                      Ir para o projeto · {{ review.projectId }}
                    </v-btn>
                  </template>
                </v-tooltip>
              </dd>
            </div>
            <div v-if="review.deliverableId">
              <dt>Entregavel</dt>
              <dd>{{ review.deliverableId }}</dd>
            </div>
            <div v-if="review.documentId">
              <dt>Documento</dt>
              <dd>
                <v-tooltip text="Abrir a tela do documento relacionado">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      :to="`/documents?documentId=${review.documentId}`"
                      color="indigo"
                      variant="tonal"
                      size="small"
                      density="compact"
                      class="review-detail__entity-link review-detail__entity-link--document"
                    >
                      Ir para o documento · {{ review.documentId }}
                    </v-btn>
                  </template>
                </v-tooltip>
              </dd>
            </div>
            <div v-if="review.documentVersionId">
              <dt>Versao do documento</dt>
              <dd>{{ review.documentVersionId }}</dd>
            </div>
          </dl>
        </section>

        <section class="review-detail__section">
          <h3>Envolvidos</h3>
          <div class="review-detail__people">
            <v-chip
              v-for="reviewer in review.reviewers"
              :key="reviewer.userId"
              color="teal"
              variant="tonal"
            >
              {{ userName(reviewer.userId) }} · {{ reviewer.role }}
            </v-chip>
          </div>
        </section>

        <section v-if="review.decisionComment" class="review-detail__decision">
          <h3>Registro da decisao</h3>
          <p>{{ review.decisionComment }}</p>
          <small v-if="review.reviewedAt">{{ formatDateTime(review.reviewedAt) }}</small>
        </section>

        <section class="review-detail__section">
          <h3>Discussao</h3>
          <div class="review-detail__thread">
            <article
              v-for="comment in review.comments ?? []"
              :key="comment.id"
              class="review-detail__comment"
            >
              <div>
                <strong>{{ userName(comment.authorUserId) }}</strong>
                <span>{{ formatDateTime(comment.createdAt) }}</span>
              </div>
              <p>{{ comment.body }}</p>
            </article>
            <v-empty-state
              v-if="!review.comments?.length"
              headline="Sem comentarios"
              text="Registre observacoes tecnicas, pendencias e combinados desta revisao."
            />
          </div>
          <v-textarea
            v-model="commentBody"
            label="Adicionar comentario tecnico"
            rows="3"
            maxlength="2000"
            counter
            variant="outlined"
            density="comfortable"
            :disabled="saving"
          />
        </section>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="emit('update:modelValue', false)">Fechar</v-btn>
        <v-spacer />
        <v-btn
          color="teal"
          variant="tonal"
          :disabled="!commentBody.trim()"
          :loading="saving"
          @click="submitComment"
        >
          Comentar
        </v-btn>
        <v-btn
          v-if="review && canDecide"
          color="green"
          variant="tonal"
          :loading="saving"
          @click="emit('approve', review)"
        >
          Aprovar
        </v-btn>
        <v-btn
          v-if="review && canDecide"
          color="red"
          variant="tonal"
          :loading="saving"
          @click="emit('reject', review)"
        >
          Rejeitar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.review-detail {
  border: 1px solid #d7e4df;
}

.review-detail__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d8e1de;
}

.review-detail__title p {
  max-width: 42rem;
  margin: 0.25rem 0 0;
  color: #63716d;
  font-size: 0.9rem;
  white-space: normal;
}

.review-detail__body {
  display: grid;
  gap: 1rem;
}

.review-detail__summary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.review-detail__summary div,
.review-detail__section,
.review-detail__decision {
  border: 1px solid #d7e4df;
  border-radius: 0.5rem;
  background: #fbfdfc;
  padding: 0.85rem;
}

.review-detail__summary span,
dt {
  color: #63716d;
  font-size: 0.72rem;
  text-transform: uppercase;
}

.review-detail__summary strong,
dd {
  display: block;
  margin: 0.2rem 0 0;
  color: #123c32;
  overflow-wrap: anywhere;
}

.review-detail__entity-link {
  min-width: 0;
  justify-content: flex-start;
  overflow-wrap: anywhere;
  text-transform: none;
  white-space: normal;
}

.review-detail__entity-link--project {
  background: #e6f6ef;
}

.review-detail__entity-link--document {
  background: #eef2ff;
}

.review-detail__links,
.review-detail__people {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

h3,
p,
dl {
  margin: 0;
}

h3 {
  margin-bottom: 0.55rem;
  color: #123c32;
  font-size: 0.95rem;
  font-weight: 680;
}

dl {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.review-detail__thread {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.review-detail__comment {
  display: grid;
  gap: 0.35rem;
  border-left: 3px solid #8ccbbd;
  background: #ffffff;
  padding: 0.65rem 0.75rem;
}

.review-detail__comment div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: #63716d;
  font-size: 0.8rem;
}

.review-detail__comment p,
.review-detail__decision p {
  color: #34443f;
  line-height: 1.55;
}

.review-detail__decision {
  background: #f5fbf9;
}

@media (max-width: 900px) {
  .review-detail__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .review-detail__summary {
    grid-template-columns: 1fr;
  }
}
</style>
