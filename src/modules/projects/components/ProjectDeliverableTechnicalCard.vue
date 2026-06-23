<script setup lang="ts">
import { computed } from 'vue'
import type {
  Deliverable,
  DocumentSummary,
  ProjectKnowledgeItem,
  ReviewSummary,
} from '@/shared/types/api-contracts'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { deliverableBadgeKind } from '@/shared/ui/status-badges'
import { formatRelativeDueDate, formatShortDate, toTimestamp } from '@/shared/formatters/date.formatter'

const props = defineProps<{
  deliverable: Deliverable
  documents: DocumentSummary[]
  reviews: ReviewSummary[]
  knowledgeItems: ProjectKnowledgeItem[]
}>()

const emit = defineEmits<{
  'update:status': [deliverable: Deliverable, status: Deliverable['status']]
}>()

const statusOptions: Array<{ title: string; value: Deliverable['status'] }> = [
  { title: 'A fazer', value: 'todo' },
  { title: 'Em andamento', value: 'in_progress' },
  { title: 'Concluido', value: 'done' },
  { title: 'Bloqueado', value: 'blocked' },
]

const typeLabels: Record<NonNullable<Deliverable['type']>, string> = {
  technical_survey: 'Levantamento tecnico',
  architectural_project: 'Projeto arquitetonico',
  structural_project: 'Projeto estrutural',
  electrical_project: 'Projeto eletrico',
  hydraulic_project: 'Projeto hidrossanitario',
  drainage_project: 'Projeto de drenagem',
  paving_project: 'Projeto de pavimentacao',
  landscaping_project: 'Paisagismo',
  lighting_project: 'Iluminacao',
  descriptive_memorial: 'Memorial descritivo',
  budget: 'Orcamento',
  schedule: 'Cronograma',
  art_rrt: 'ART/RRT',
  photographic_report: 'Relatorio fotografico',
  technical_report: 'Relatorio tecnico',
  other: 'Outro',
}

const todayStart = computed(() => {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
})

const linkedDocuments = computed(() =>
  props.documents.filter((document) => document.deliverableId === props.deliverable.id),
)

const officialDocuments = computed(() =>
  linkedDocuments.value.filter((document) => document.officialVersion || document.status === 'approved'),
)

const linkedDocumentIds = computed(() => new Set(linkedDocuments.value.map((document) => document.id)))

const linkedReviews = computed(() =>
  props.reviews.filter(
    (review) =>
      review.deliverableId === props.deliverable.id ||
      Boolean(review.documentId && linkedDocumentIds.value.has(review.documentId)),
  ),
)

const pendingReviews = computed(() =>
  linkedReviews.value.filter((review) => review.status === 'pending' || review.status === 'overdue'),
)

const rejectedReviews = computed(() =>
  linkedReviews.value.filter((review) => review.status === 'rejected'),
)

const normalizedDeliverableContext = computed(() =>
  normalizeText(
    [
      props.deliverable.title,
      props.deliverable.description,
      props.deliverable.type,
      props.deliverable.type ? typeLabels[props.deliverable.type] : '',
    ].join(' '),
  ),
)

const directlyAppliedKnowledgeItems = computed(() =>
  props.knowledgeItems.filter(
    (entry) => entry.targetType === 'deliverable' && entry.targetId === props.deliverable.id,
  ),
)

const projectWideKnowledgeItems = computed(() =>
  props.knowledgeItems.filter((entry) => entry.targetType === 'project'),
)

const matchedKnowledgeItems = computed(() =>
  projectWideKnowledgeItems.value.filter(({ knowledgeItem }) => {
    const tags = Array.isArray(knowledgeItem.tags) ? knowledgeItem.tags : []
    const searchableKnowledge = normalizeText([
      knowledgeItem.title,
      knowledgeItem.description,
      knowledgeItem.type,
      tags.join(' '),
    ].join(' '))

    if (!searchableKnowledge) {
      return false
    }

    const deliverableTokens = new Set(normalizedDeliverableContext.value.split(' ').filter(Boolean))
    const hasMatchingTag = tags.some((tag) => {
      const normalizedTag = normalizeText(tag)
      return normalizedTag && normalizedDeliverableContext.value.includes(normalizedTag)
    })
    const hasMatchingTerm = searchableKnowledge
      .split(' ')
      .filter((term) => term.length > 4)
      .some((term) => deliverableTokens.has(term))

    return hasMatchingTag || hasMatchingTerm
  }),
)

const contextualKnowledgeItems = computed(() => {
  if (directlyAppliedKnowledgeItems.value.length) {
    return directlyAppliedKnowledgeItems.value.slice(0, 3)
  }

  if (matchedKnowledgeItems.value.length) {
    return matchedKnowledgeItems.value.slice(0, 3)
  }

  return projectWideKnowledgeItems.value.slice(0, 2)
})

const isOverdue = computed(() => {
  const dueDate = toTimestamp(props.deliverable.dueDate)
  return Boolean(dueDate && dueDate < todayStart.value && props.deliverable.status !== 'done')
})

const assigneeLabel = computed(() =>
  props.deliverable.assignees.length
    ? props.deliverable.assignees.join(', ')
    : 'Sem responsavel definido',
)

const dueDateLabel = computed(() =>
  props.deliverable.dueDate ? formatRelativeDueDate(props.deliverable.dueDate) : 'Sem prazo definido',
)

const riskItems = computed(() => {
  const items: string[] = []

  if (props.deliverable.status === 'blocked') {
    items.push('Bloqueio operacional ativo')
  }

  if (isOverdue.value) {
    items.push('Prazo vencido')
  }

  if (rejectedReviews.value.length > 0) {
    items.push('Revisao reprovada exige retrabalho')
  }

  if (pendingReviews.value.length > 0) {
    items.push('Revisao pendente segurando liberacao')
  }

  if (linkedDocuments.value.length > 0 && officialDocuments.value.length === 0) {
    items.push('Documentos ainda sem versao oficial')
  }

  if (props.deliverable.assignees.length === 0) {
    items.push('Responsavel tecnico indefinido')
  }

  if (contextualKnowledgeItems.value.length === 0) {
    items.push('Sem referencia tecnica aplicada ao entregavel')
  }

  return items
})

const riskTone = computed<'success' | 'warning' | 'error'>(() => {
  if (props.deliverable.status === 'blocked' || isOverdue.value || rejectedReviews.value.length > 0) {
    return 'error'
  }

  if (riskItems.value.length > 0) {
    return 'warning'
  }

  return 'success'
})

const riskLabel = computed(() => {
  if (riskTone.value === 'error') return 'Risco alto'
  if (riskTone.value === 'warning') return 'Atenção técnica'
  return 'Saudável'
})
const primaryRisk = computed(() => riskItems.value[0] ?? 'Sem ponto crítico evidente')
const documentSignal = computed(() => {
  if (!linkedDocuments.value.length) return 'Sem documento vinculado'
  if (!officialDocuments.value.length) return `${linkedDocuments.value.length} doc(s), sem oficial`
  return `${officialDocuments.value.length}/${linkedDocuments.value.length} oficial(is)`
})
const reviewSignal = computed(() => {
  if (pendingReviews.value.length) return `${pendingReviews.value.length} pendente(s)`
  if (rejectedReviews.value.length) return `${rejectedReviews.value.length} reprovada(s)`
  return `${linkedReviews.value.length} revisão(ões)`
})
const knowledgeSignal = computed(() =>
  contextualKnowledgeItems.value.length
    ? `${contextualKnowledgeItems.value.length} referência(s)`
    : 'Sem knowledge aplicado',
)

const actionHint = computed(() => {
  if (props.deliverable.status === 'blocked') return 'Remover bloqueio'
  if (isOverdue.value) return 'Replanejar prazo'
  if (rejectedReviews.value.length > 0) return 'Tratar reprovação'
  if (pendingReviews.value.length > 0) return 'Destravar revisão'
  if (officialDocuments.value.length === 0) return 'Oficializar documento'
  return 'Manter acompanhamento'
})

function updateStatus(status: Deliverable['status'] | null) {
  if (!status || status === props.deliverable.status) {
    return
  }

  emit('update:status', props.deliverable, status)
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
</script>

<template>
  <v-sheet border rounded="xl" class="deliverable-technical-card">
    <div class="deliverable-technical-card__status-rail" :data-tone="riskTone" />

    <div class="deliverable-technical-card__header">
      <div class="deliverable-technical-card__title-block">
        <span class="deliverable-technical-card__eyebrow">
          {{ deliverable.type ? typeLabels[deliverable.type] : 'Entregavel tecnico' }}
        </span>
        <h3>{{ deliverable.title }}</h3>
        <p>{{ deliverable.description || 'Sem descricao tecnica cadastrada para este entregavel.' }}</p>
      </div>

      <div class="deliverable-technical-card__status">
        <BaseStatusBadge :kind="deliverableBadgeKind(deliverable.status)" />
        <span :class="['deliverable-technical-card__risk', `deliverable-technical-card__risk--${riskTone}`]">
          {{ riskLabel }}
        </span>
      </div>
    </div>

    <div class="deliverable-technical-card__tags">
      <v-chip
        v-for="tag in (deliverable.tags ?? []).slice(0, 6)"
        :key="tag.id"
        color="teal"
        variant="tonal"
        size="small"
      >
        {{ tag.name }}
      </v-chip>
      <span v-if="!(deliverable.tags ?? []).length" class="deliverable-technical-card__muted">
        Sem tags governadas neste entregavel.
      </span>
    </div>

    <div class="deliverable-technical-card__signals">
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Prazo</span>
        <strong>{{ dueDateLabel }}</strong>
        <small v-if="deliverable.dueDate">{{ formatShortDate(deliverable.dueDate) }}</small>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Responsável</span>
        <strong>{{ assigneeLabel }}</strong>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Próxima ação</span>
        <strong>{{ actionHint }}</strong>
      </v-sheet>
    </div>

    <div class="deliverable-technical-card__compact-insights">
      <div>
        <span>Documentos</span>
        <strong>{{ documentSignal }}</strong>
        <small v-if="linkedDocuments[0]">{{ linkedDocuments[0].title }}</small>
      </div>
      <div>
        <span>Revisões</span>
        <strong>{{ reviewSignal }}</strong>
        <small v-if="linkedReviews[0]">{{ linkedReviews[0].comment || 'Revisão técnica' }}</small>
      </div>
      <div>
        <span>Knowledge</span>
        <strong>{{ knowledgeSignal }}</strong>
        <small v-if="contextualKnowledgeItems[0]">{{ contextualKnowledgeItems[0].knowledgeItem.title }}</small>
      </div>
      <div>
        <span>Alerta</span>
        <strong>{{ primaryRisk }}</strong>
      </div>
    </div>

    <div class="deliverable-technical-card__footer">
      <v-select
        :model-value="deliverable.status"
        :items="statusOptions"
        label="Atualizar status"
        density="compact"
        variant="outlined"
        hide-details
        class="deliverable-technical-card__status-select"
        @update:model-value="updateStatus"
      />
      <v-btn
        :to="`/projects/${deliverable.projectId}/deliverables/${deliverable.id}/edit`"
        color="teal"
        variant="tonal"
        prepend-icon="$edit"
      >
        Abrir entregavel
      </v-btn>
    </div>
  </v-sheet>
</template>

<style scoped>
.deliverable-technical-card {
  position: relative;
  display: grid;
  gap: 0.7rem;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(232 248 242 / 0.82), rgb(255 255 255 / 0.96) 34%),
    #ffffff;
  padding: 0.8rem 0.85rem 0.85rem 1rem;
  box-shadow: 0 10px 24px rgb(15 45 38 / 0.06);
}

.deliverable-technical-card__status-rail {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.28rem;
  background: #0f766e;
}

.deliverable-technical-card__status-rail[data-tone='warning'] {
  background: #d9901f;
}

.deliverable-technical-card__status-rail[data-tone='error'] {
  background: #c2413b;
}

.deliverable-technical-card__header,
.deliverable-technical-card__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.deliverable-technical-card__title-block {
  min-width: 0;
}

.deliverable-technical-card__eyebrow,
.deliverable-technical-card__signal span {
  color: #267365;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.deliverable-technical-card h3,
.deliverable-technical-card h4 {
  margin: 0;
  color: #14231f;
}

.deliverable-technical-card h3 {
  margin-top: 0.12rem;
  font-size: 1rem;
  line-height: 1.22;
}

.deliverable-technical-card h4 {
  font-size: 0.9rem;
}

.deliverable-technical-card p,
.deliverable-technical-card small,
.deliverable-technical-card__muted {
  color: #60716b;
}

.deliverable-technical-card p {
  display: -webkit-box;
  margin: 0.25rem 0 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.88rem;
}

.deliverable-technical-card__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

.deliverable-technical-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.deliverable-technical-card__risk {
  border-radius: 999px;
  padding: 0.22rem 0.48rem;
  font-size: 0.68rem;
  font-weight: 800;
}

.deliverable-technical-card__risk--success {
  background: #dff5ea;
  color: #176145;
}

.deliverable-technical-card__risk--warning {
  background: #fff2d8;
  color: #8a5b0a;
}

.deliverable-technical-card__risk--error {
  background: #fde2df;
  color: #9a2f28;
}

.deliverable-technical-card__signals,
.deliverable-technical-card__compact-insights {
  display: grid;
  gap: 0.55rem;
}

.deliverable-technical-card__signal {
  display: grid;
  gap: 0.12rem;
  border: 1px solid #d8e5df;
  border-radius: 0.7rem;
  background: rgb(255 255 255 / 0.82);
  padding: 0.55rem 0.6rem;
}

.deliverable-technical-card__signal strong,
.deliverable-technical-card__compact-insights strong {
  color: #1b332c;
}

.deliverable-technical-card__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.deliverable-technical-card__signal {
  background: #f5fbf8;
}

.deliverable-technical-card__signal strong {
  font-size: 0.92rem;
  line-height: 1.25;
}

.deliverable-technical-card__compact-insights {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.deliverable-technical-card__compact-insights > div {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  border: 1px solid #d8e5df;
  border-radius: 0.7rem;
  background: rgb(255 255 255 / 0.72);
  padding: 0.55rem 0.6rem;
}

.deliverable-technical-card__compact-insights span {
  color: #267365;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.deliverable-technical-card__compact-insights strong,
.deliverable-technical-card__compact-insights small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deliverable-technical-card__compact-insights strong {
  font-size: 0.86rem;
}

.deliverable-technical-card__footer {
  align-items: center;
}

.deliverable-technical-card__footer :deep(.v-btn) {
  min-height: 2.25rem;
}

.deliverable-technical-card__status-select {
  max-width: 13rem;
}

@media (max-width: 1100px) {
  .deliverable-technical-card__signals,
  .deliverable-technical-card__compact-insights {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .deliverable-technical-card__header,
  .deliverable-technical-card__footer {
    display: grid;
  }

  .deliverable-technical-card__status {
    justify-items: start;
  }

  .deliverable-technical-card__status-select {
    max-width: none;
  }

  .deliverable-technical-card__compact-insights {
    grid-template-columns: 1fr;
  }
}
</style>
