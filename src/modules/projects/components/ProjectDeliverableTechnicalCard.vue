<script setup lang="ts">
import { computed } from 'vue'
import type {
  Deliverable,
  DocumentSummary,
  ProjectKnowledgeItem,
  ReviewSummary,
} from '@/shared/types/api-contracts'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import { deliverableBadgeKind, documentBadgeKind, reviewBadgeKind } from '@/shared/ui/status-badges'
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

const knowledgeSignalLabel = computed(() => {
  if (directlyAppliedKnowledgeItems.value.length) return 'aplicado no entregavel'
  if (matchedKnowledgeItems.value.length) return 'afinidade do projeto'
  return 'contexto do projeto'
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

    <div class="deliverable-technical-card__quick-info">
      <div>
        <span>Responsavel</span>
        <strong>{{ assigneeLabel }}</strong>
      </div>
      <div>
        <span>Prazo</span>
        <strong>{{ dueDateLabel }}</strong>
        <small v-if="deliverable.dueDate">{{ formatShortDate(deliverable.dueDate) }}</small>
      </div>
      <div>
        <span>Proxima acao</span>
        <strong>{{ actionHint }}</strong>
      </div>
    </div>

    <div class="deliverable-technical-card__signals">
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Documentos oficiais</span>
        <strong>{{ officialDocuments.length }}/{{ linkedDocuments.length }}</strong>
        <small>{{ linkedDocuments.length ? 'rastreaveis no entregavel' : 'nenhum documento vinculado' }}</small>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Revisoes pendentes</span>
        <strong>{{ pendingReviews.length }}</strong>
        <small>{{ rejectedReviews.length }} reprovada(s)</small>
      </v-sheet>
      <v-sheet rounded="lg" class="deliverable-technical-card__signal">
        <span>Knowledge aplicado</span>
        <strong>{{ contextualKnowledgeItems.length }}</strong>
        <small>{{ knowledgeSignalLabel }}</small>
      </v-sheet>
    </div>

    <div class="deliverable-technical-card__content-grid">
      <section>
        <div class="deliverable-technical-card__section-head">
          <h4>Documentos e revisoes</h4>
          <span>{{ linkedReviews.length }} revisao(oes)</span>
        </div>
        <div class="deliverable-technical-card__list">
          <div
            v-for="document in linkedDocuments.slice(0, 3)"
            :key="document.id"
            class="deliverable-technical-card__list-item"
          >
            <div>
              <strong>{{ document.title }}</strong>
              <small>
                {{ document.officialVersion?.revision ? `Oficial ${document.officialVersion.revision}` : 'Sem oficial definida' }}
              </small>
            </div>
            <BaseStatusBadge :kind="documentBadgeKind(document.status)" size="x-small" />
          </div>

          <div
            v-for="review in linkedReviews.slice(0, 2)"
            :key="review.id"
            class="deliverable-technical-card__list-item deliverable-technical-card__list-item--review"
          >
            <div>
              <strong>{{ review.comment || 'Revisao tecnica' }}</strong>
              <small>{{ review.dueDate ? formatRelativeDueDate(review.dueDate) : 'Sem prazo de revisao' }}</small>
            </div>
            <BaseStatusBadge :kind="reviewBadgeKind(review.status)" size="x-small" />
          </div>

          <v-empty-state
            v-if="linkedDocuments.length === 0 && linkedReviews.length === 0"
            density="compact"
            headline="Sem vinculos ainda"
            text="Quando documentos e revisoes forem conectados, este card vira o mapa operacional do entregavel."
          />
        </div>
      </section>

      <section>
        <div class="deliverable-technical-card__section-head">
          <h4>Conhecimento e riscos</h4>
          <span>{{ riskItems.length || 'sem' }} alerta(s)</span>
        </div>

        <div class="deliverable-technical-card__knowledge">
          <v-chip
            v-for="{ knowledgeItem } in contextualKnowledgeItems"
            :key="knowledgeItem.id"
            color="teal"
            variant="tonal"
            size="small"
          >
            {{ knowledgeItem.title }}
          </v-chip>
          <span v-if="contextualKnowledgeItems.length === 0" class="deliverable-technical-card__muted">
            Aplique referencias ou padroes para orientar decisoes deste entregavel.
          </span>
        </div>

        <div class="deliverable-technical-card__risks">
          <v-alert
            v-if="riskItems.length === 0"
            type="success"
            variant="tonal"
            density="compact"
          >
            Sem ponto critico evidente.
          </v-alert>
          <v-alert
            v-for="risk in riskItems.slice(0, 3)"
            :key="risk"
            :type="riskTone === 'error' ? 'error' : 'warning'"
            variant="tonal"
            density="compact"
          >
            {{ risk }}
          </v-alert>
        </div>
      </section>
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
  gap: 1rem;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(232 248 242 / 0.82), rgb(255 255 255 / 0.96) 34%),
    #ffffff;
  padding: 1rem 1rem 1rem 1.25rem;
  box-shadow: 0 16px 36px rgb(15 45 38 / 0.08);
}

.deliverable-technical-card__status-rail {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.35rem;
  background: #0f766e;
}

.deliverable-technical-card__status-rail[data-tone='warning'] {
  background: #d9901f;
}

.deliverable-technical-card__status-rail[data-tone='error'] {
  background: #c2413b;
}

.deliverable-technical-card__header,
.deliverable-technical-card__footer,
.deliverable-technical-card__section-head,
.deliverable-technical-card__list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.deliverable-technical-card__title-block {
  min-width: 0;
}

.deliverable-technical-card__eyebrow,
.deliverable-technical-card__quick-info span,
.deliverable-technical-card__signal span,
.deliverable-technical-card__section-head span {
  color: #267365;
  font-size: 0.72rem;
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
  margin-top: 0.2rem;
  font-size: 1.12rem;
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
  margin: 0.35rem 0 0;
}

.deliverable-technical-card__status {
  display: grid;
  justify-items: end;
  gap: 0.45rem;
}

.deliverable-technical-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.deliverable-technical-card__risk {
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  font-size: 0.72rem;
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

.deliverable-technical-card__quick-info,
.deliverable-technical-card__signals,
.deliverable-technical-card__content-grid {
  display: grid;
  gap: 0.75rem;
}

.deliverable-technical-card__quick-info {
  grid-template-columns: 1.25fr 0.9fr 1fr;
}

.deliverable-technical-card__quick-info > div,
.deliverable-technical-card__signal {
  display: grid;
  gap: 0.22rem;
  border: 1px solid #d8e5df;
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 0.82);
  padding: 0.75rem;
}

.deliverable-technical-card__quick-info strong,
.deliverable-technical-card__signal strong,
.deliverable-technical-card__list-item strong {
  color: #1b332c;
}

.deliverable-technical-card__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.deliverable-technical-card__signal {
  background: #f5fbf8;
}

.deliverable-technical-card__signal strong {
  font-size: 1.35rem;
  line-height: 1;
}

.deliverable-technical-card__content-grid {
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
}

.deliverable-technical-card__content-grid section {
  display: grid;
  align-content: start;
  gap: 0.65rem;
  border: 1px solid #d8e5df;
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 0.72);
  padding: 0.85rem;
}

.deliverable-technical-card__list,
.deliverable-technical-card__knowledge,
.deliverable-technical-card__risks {
  display: grid;
  gap: 0.55rem;
}

.deliverable-technical-card__list-item {
  align-items: center;
  border-radius: 0.75rem;
  background: #f8fcfa;
  padding: 0.65rem;
}

.deliverable-technical-card__list-item--review {
  background: #fffaf0;
}

.deliverable-technical-card__list-item > div {
  display: grid;
  min-width: 0;
}

.deliverable-technical-card__knowledge {
  grid-template-columns: repeat(auto-fit, minmax(9rem, max-content));
  align-items: center;
}

.deliverable-technical-card__footer {
  align-items: center;
}

.deliverable-technical-card__status-select {
  max-width: 14rem;
}

@media (max-width: 1100px) {
  .deliverable-technical-card__quick-info,
  .deliverable-technical-card__signals,
  .deliverable-technical-card__content-grid {
    grid-template-columns: 1fr;
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
}
</style>
