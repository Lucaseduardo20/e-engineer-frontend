<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type {
  AuditLogEntry,
  Deliverable,
  DocumentStatus,
  DocumentSummary,
  DocumentType,
  Project,
  ProjectKnowledgeItem,
  ProjectKnowledgeRecommendation,
  ProjectTechnicalProfile,
  ReviewSummary,
} from '@/shared/types/api-contracts'
import { apiClient } from '@/shared/http/api-client'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import TraceableLinkButton from '@/shared/components/TraceableLinkButton.vue'
import {
  deliverableBadgeKind,
  documentBadgeKind,
  projectBadgeKind,
  reviewBadgeKind,
} from '@/shared/ui/status-badges'
import {
  formatDateTime,
  formatRelativeDueDate,
  formatShortDate,
  toTimestamp,
} from '@/shared/formatters/date.formatter'
import DeliverablesBoard from './DeliverablesBoard.vue'
import InheritedDeliverablesReviewBanner from './InheritedDeliverablesReviewBanner.vue'
import ProjectKnowledgeSection from './ProjectKnowledgeSection.vue'
import ProjectDeliverableTechnicalCard from './ProjectDeliverableTechnicalCard.vue'
import DocumentUpload from '@/modules/documents/components/DocumentUpload.vue'

const props = defineProps<{
  project: Project
  deliverables: Deliverable[]
  documents: DocumentSummary[]
  reviews: ReviewSummary[]
  knowledgeItems: ProjectKnowledgeItem[]
  knowledgeRecommendations: ProjectKnowledgeRecommendation[]
  technicalProfile?: ProjectTechnicalProfile | null
  auditLogs: AuditLogEntry[]
}>()

const emit = defineEmits<{
  'update:deliverable-status': [deliverable: Deliverable, status: Deliverable['status']]
  refresh: []
}>()

const authStore = useAuthStore()
const activeTab = ref('overview')
const isDocumentModalOpen = ref(false)
const isSavingDocument = ref(false)
const inheritanceReviewSavingIds = ref<string[]>([])
const contextualRecommendationSavingIds = ref<string[]>([])
const removalDialog = ref<{
  deliverable: Deliverable
  mode: 'request' | 'approve' | 'reject'
} | null>(null)
const removalReason = ref('')

const todayStart = computed(() => {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
})
const overdueDeliverables = computed(() =>
  props.deliverables.filter((deliverable) => {
    const dueDate = toTimestamp(deliverable.dueDate)
    return Boolean(dueDate && dueDate < todayStart.value && deliverable.status !== 'done')
  }),
)
const officialDocuments = computed(() =>
  props.documents.filter((document) => document.officialVersion || document.status === 'approved'),
)
const pendingReviews = computed(() =>
  props.reviews.filter((review) => review.status === 'pending' || review.status === 'overdue'),
)
const rejectedReviews = computed(() =>
  props.reviews.filter((review) => review.status === 'rejected'),
)
const activeDeliverables = computed(() =>
  props.deliverables.filter((deliverable) => deliverable.status !== 'done'),
)
const pendingInheritedDeliverables = computed(() =>
  props.deliverables.filter(
    (deliverable) => deliverable.inheritanceReview?.needsReviewAfterInheritance,
  ),
)
const canApproveDeliverableRemoval = computed(
  () =>
    authStore.isPlatformAdmin ||
    (authStore.user?.roles ?? []).some((role) => ['owner', 'admin', 'manager'].includes(role)),
)
const nextDueDeliverable = computed(() =>
  [...activeDeliverables.value]
    .filter((deliverable) => Boolean(deliverable.dueDate))
    .sort((first, second) => (toTimestamp(first.dueDate) ?? 0) - (toTimestamp(second.dueDate) ?? 0))[0],
)
const featuredDeliverables = computed(() =>
  [...props.deliverables]
    .sort((first, second) => {
      const firstRisk = overdueDeliverables.value.some((deliverable) => deliverable.id === first.id) ? -1 : 0
      const secondRisk = overdueDeliverables.value.some((deliverable) => deliverable.id === second.id) ? -1 : 0
      return firstRisk - secondRisk || (toTimestamp(first.dueDate) ?? Infinity) - (toTimestamp(second.dueDate) ?? Infinity)
    })
    .slice(0, 4),
)
const inheritedTags = computed(() => {
  const tags = new Map<
    string,
    {
      id: string
      name: string
      slug: string
      category: string
      status: string
      deliverables: string[]
    }
  >()

  for (const deliverable of props.deliverables) {
    for (const tag of deliverable.tags ?? []) {
      const current = tags.get(tag.id) ?? {
        ...tag,
        deliverables: [],
      }
      if (!current.deliverables.includes(deliverable.title)) {
        current.deliverables.push(deliverable.title)
      }
      tags.set(tag.id, current)
    }
  }

  return [...tags.values()].sort(
    (first, second) =>
      second.deliverables.length - first.deliverables.length ||
      first.name.localeCompare(second.name),
  )
})
const visibleInheritedTags = computed(() => inheritedTags.value.slice(0, 8))
const hiddenInheritedTagsCount = computed(() => Math.max(inheritedTags.value.length - visibleInheritedTags.value.length, 0))
const visibleProjectTags = computed(() => (props.project.tags ?? []).slice(0, 8))
const hiddenProjectTagsCount = computed(() => Math.max((props.project.tags ?? []).length - visibleProjectTags.value.length, 0))
const visibleLegacyProjectTags = computed(() => (props.project.legacyTags ?? []).slice(0, 6))
const visibleTechnicalProfileTags = computed(() => (props.technicalProfile?.tags ?? []).slice(0, 8))
const hiddenTechnicalProfileTagsCount = computed(() =>
  Math.max((props.technicalProfile?.tags.length ?? 0) - visibleTechnicalProfileTags.value.length, 0),
)
const recommendationCount = computed(() => recommendations.value.length + props.knowledgeRecommendations.length)
const knowledgeValueLabel = computed(() =>
  props.knowledgeItems.length
    ? `${props.knowledgeItems.length} referencia(s) reduzindo retrabalho`
    : 'Nenhuma referencia aplicada ainda',
)
const deliverableFocusLabel = computed(() => {
  if (overdueDeliverables.value.length) return `${overdueDeliverables.value.length} entrega(s) precisam de acao`
  if (pendingReviews.value.length) return `${pendingReviews.value.length} revisao(oes) segurando fluxo`
  if (activeDeliverables.value.length) return `${activeDeliverables.value.length} entrega(s) em producao`
  return 'Fluxo tecnico estabilizado'
})
const riskItems = computed(() => {
  const items: Array<{
    title: string
    description: string
    tone: 'error' | 'warning' | 'success' | 'info'
  }> = []

  if (overdueDeliverables.value.length > 0) {
    items.push({
      title: 'Entregaveis atrasados',
      description: `${overdueDeliverables.value.length} entregavel(is) exigem replanejamento de prazo ou responsavel.`,
      tone: 'error',
    })
  }

  if (rejectedReviews.value.length > 0) {
    items.push({
      title: 'Revisoes reprovadas',
      description: `${rejectedReviews.value.length} revisao(oes) registram retrabalho ou decisao tecnica negativa.`,
      tone: 'warning',
    })
  }

  if (props.knowledgeItems.length === 0) {
    items.push({
      title: 'Sem conhecimento aplicado',
      description: 'Vincule referencias, padroes ou licoes aprendidas para reduzir risco de repeticao.',
      tone: 'info',
    })
  }

  return items
})
const recommendations = computed(() => {
  const items: Array<{ title: string; description: string; actionLabel: string; to?: string }> = []

  if (props.knowledgeItems.length === 0) {
    items.push({
      title: 'Vincular conhecimento tecnico',
      description: 'Use referencias e modelos ja aprovados para orientar a equipe neste projeto.',
      actionLabel: 'Ver base',
      to: '/knowledge-base',
    })
  }

  if (pendingReviews.value.length > 0) {
    items.push({
      title: 'Priorizar revisoes pendentes',
      description: 'Resolva revisoes abertas para liberar documentos oficiais e reduzir filas.',
      actionLabel: 'Abrir revisoes',
      to: '/reviews',
    })
  }

  if (officialDocuments.value.length === 0) {
    items.push({
      title: 'Definir documentos oficiais',
      description: 'Marque versoes oficiais para consolidar entregas e facilitar rastreabilidade.',
      actionLabel: 'Ver documentos',
      to: '/documents',
    })
  }

  if (overdueDeliverables.value.length > 0) {
    items.push({
      title: 'Revisar plano de entregas',
      description: 'Atualize prazos e responsaveis dos entregaveis atrasados.',
      actionLabel: 'Gerenciar',
      to: `/projects/${props.project.id}/deliverables`,
    })
  }

  return items
})
const metrics = computed(() => [
  {
    label: 'Entregaveis totais',
    value: props.deliverables.length,
    detail: `${activeDeliverables.value.length} em aberto`,
    color: 'teal',
    emphasis: true,
  },
  {
    label: 'Entregaveis atrasados',
    value: overdueDeliverables.value.length,
    detail: overdueDeliverables.value.length ? 'pedem atencao' : 'sem atraso',
    color: overdueDeliverables.value.length ? 'red' : 'green',
    emphasis: overdueDeliverables.value.length > 0,
  },
  {
    label: 'Documentos oficiais',
    value: officialDocuments.value.length,
    detail: `${props.documents.length} documento(s) no projeto`,
    color: 'green',
  },
  {
    label: 'Revisoes pendentes',
    value: pendingReviews.value.length,
    detail: `${props.reviews.length} revisao(oes) totais`,
    color: pendingReviews.value.length ? 'amber' : 'green',
    emphasis: pendingReviews.value.length > 0,
  },
  {
    label: 'Revisoes reprovadas',
    value: rejectedReviews.value.length,
    detail: rejectedReviews.value.length ? 'geram aprendizado' : 'sem reprovacao',
    color: rejectedReviews.value.length ? 'red' : 'green',
    emphasis: rejectedReviews.value.length > 0,
  },
  {
    label: 'Conhecimentos aplicados',
    value: props.knowledgeItems.length,
    detail: props.knowledgeItems.length ? 'referencias vinculadas' : 'nenhum vinculo',
    color: 'purple',
    emphasis: true,
  },
  {
    label: 'Recomendacoes',
    value: recommendationCount.value,
    detail: recommendationCount.value ? 'acoes sugeridas' : 'sem sugestoes',
    color: 'blue',
  },
  {
    label: 'Herdados a revisar',
    value: pendingInheritedDeliverables.value.length,
    detail: pendingInheritedDeliverables.value.length ? 'validacao tecnica' : 'revisao concluida',
    color: pendingInheritedDeliverables.value.length ? 'amber' : 'green',
    emphasis: pendingInheritedDeliverables.value.length > 0,
  },
])
const recentHistory = computed(() => props.auditLogs.slice(0, 6))
const tabItems = computed(() => [
  { title: 'Visao geral', value: 'overview', count: recommendationCount.value + props.knowledgeItems.length },
  { title: 'Entregaveis', value: 'deliverables', count: props.deliverables.length },
  { title: 'Documentos', value: 'documents', count: props.documents.length },
  { title: 'Revisoes', value: 'reviews', count: props.reviews.length },
  { title: 'Historico', value: 'history', count: props.auditLogs.length },
])

function updateDeliverableStatus(deliverable: Deliverable, status: Deliverable['status']) {
  emit('update:deliverable-status', deliverable, status)
}

function firstAssignee() {
  return props.deliverables.flatMap((deliverable) => deliverable.assignees)[0]
}

function inheritedTagOrigin(tag: { deliverables: string[] }) {
  return tag.deliverables.length
    ? `Incluida via ${tag.deliverables.slice(0, 3).join(', ')}${tag.deliverables.length > 3 ? ` +${tag.deliverables.length - 3}` : ''}`
    : 'Sem origem operacional'
}

function recommendationTypeLabel(type: ProjectKnowledgeRecommendation['type']) {
  if (type === 'document_model') return 'Modelo de documento'
  if (type === 'review_checklist') return 'Checklist'
  if (type === 'project_reference') return 'Projeto de referencia'
  return 'Conhecimento'
}

async function applyKnowledgeRecommendation(recommendation: ProjectKnowledgeRecommendation) {
  if (
    recommendation.alreadyApplied ||
    contextualRecommendationSavingIds.value.includes(recommendation.knowledgeItem.id)
  ) {
    return
  }

  contextualRecommendationSavingIds.value = [
    ...contextualRecommendationSavingIds.value,
    recommendation.knowledgeItem.id,
  ]

  try {
    await apiClient.projects.linkKnowledge(props.project.id, {
      knowledgeItemId: recommendation.knowledgeItem.id,
      relationType:
        recommendation.type === 'review_checklist'
          ? 'checklist_for'
          : recommendation.type === 'document_model'
            ? 'model_for'
            : 'reference_for',
    })
    emit('refresh')
  } finally {
    contextualRecommendationSavingIds.value = contextualRecommendationSavingIds.value.filter(
      (id) => id !== recommendation.knowledgeItem.id,
    )
  }
}

async function handleDocumentSubmit(payload: {
  projectId: string
  deliverableId?: string | null
  title: string
  description?: string | null
  type: DocumentType
  status: DocumentStatus
  file?: File
  revision?: string
  isOfficial: boolean
  notes?: string | null
  tagIds?: string[]
}) {
  isSavingDocument.value = true

  try {
    const document = await apiClient.documents.create({
      projectId: props.project.id,
      deliverableId: payload.deliverableId,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      status: payload.status,
      tagIds: payload.tagIds,
    })

    if (payload.file) {
      await apiClient.documents.uploadVersion(document.id, {
        file: payload.file,
        revision: payload.revision,
        isOfficial: payload.isOfficial,
        status: payload.status,
        notes: payload.notes,
      })
    }

    isDocumentModalOpen.value = false
    emit('refresh')
  } finally {
    isSavingDocument.value = false
  }
}

async function markInheritedDeliverableReviewed(deliverable: Deliverable) {
  if (inheritanceReviewSavingIds.value.includes(deliverable.id)) return
  inheritanceReviewSavingIds.value = [...inheritanceReviewSavingIds.value, deliverable.id]

  try {
    await apiClient.deliverables.markInheritanceReviewed(deliverable.id)
    emit('refresh')
  } finally {
    inheritanceReviewSavingIds.value = inheritanceReviewSavingIds.value.filter(
      (id) => id !== deliverable.id,
    )
  }
}

async function removeInheritedDeliverable(deliverable: Deliverable) {
  removalDialog.value = { deliverable, mode: 'request' }
  removalReason.value = ''
}

async function approveInheritedDeliverableRemoval(deliverable: Deliverable) {
  removalDialog.value = { deliverable, mode: 'approve' }
  removalReason.value = ''
}

async function rejectInheritedDeliverableRemoval(deliverable: Deliverable) {
  removalDialog.value = { deliverable, mode: 'reject' }
  removalReason.value = ''
}

async function submitRemovalDialog() {
  const dialog = removalDialog.value
  if (!dialog) return
  const deliverable = dialog.deliverable
  if (inheritanceReviewSavingIds.value.includes(deliverable.id)) return
  inheritanceReviewSavingIds.value = [...inheritanceReviewSavingIds.value, deliverable.id]

  try {
    if (dialog.mode === 'request') {
      await apiClient.deliverables.requestRemoval(deliverable.id, {
        reason: removalReason.value,
      })
    } else if (dialog.mode === 'approve' && deliverable.removalRequest) {
      await apiClient.deliverables.approveRemoval(deliverable.removalRequest.id, {
        comment: removalReason.value || null,
      })
    } else if (dialog.mode === 'reject' && deliverable.removalRequest) {
      await apiClient.deliverables.rejectRemoval(deliverable.removalRequest.id, {
        comment: removalReason.value || null,
      })
    }

    removalDialog.value = null
    removalReason.value = ''
    emit('refresh')
  } finally {
    inheritanceReviewSavingIds.value = inheritanceReviewSavingIds.value.filter(
      (id) => id !== deliverable.id,
    )
  }
}
</script>

<template>
  <main class="project-cockpit">
    <section class="project-cockpit__hero">
      <div class="project-cockpit__hero-copy">
        <span class="project-cockpit__eyebrow">Cockpit tecnico</span>
        <div class="project-cockpit__title-row">
          <h1>{{ project.name }}</h1>
          <BaseStatusBadge :kind="projectBadgeKind(project.status)" />
        </div>
        <p>{{ project.description || project.client || 'Projeto tecnico sem descricao cadastrada.' }}</p>
        <div class="project-cockpit__meta">
          <span>Cliente: <strong>{{ project.client || 'Nao informado' }}</strong></span>
          <span>Responsavel: <strong>{{ project.responsibleName || firstAssignee() || 'Nao definido' }}</strong></span>
          <span>Prazo: <strong>{{ nextDueDeliverable ? formatRelativeDueDate(nextDueDeliverable.dueDate) : 'sem prazo critico' }}</strong></span>
        </div>
        <div class="project-cockpit__tag-strip">
          <span class="project-cockpit__tag-label">Tags do projeto</span>
          <div v-if="visibleProjectTags.length" class="project-cockpit__tag-list">
            <v-chip
              v-for="tag in visibleProjectTags"
              :key="tag.id"
              color="teal"
              variant="tonal"
              size="small"
            >
              {{ tag.name }}
            </v-chip>
            <v-chip v-if="hiddenProjectTagsCount" color="teal" variant="outlined" size="small">
              +{{ hiddenProjectTagsCount }} tag(s)
            </v-chip>
          </div>
          <div v-else-if="visibleLegacyProjectTags.length" class="project-cockpit__tag-list">
            <v-chip
              v-for="tag in visibleLegacyProjectTags"
              :key="tag"
              color="blue-grey"
              variant="tonal"
              size="small"
            >
              {{ tag }}
            </v-chip>
          </div>
          <span v-else class="project-cockpit__tag-empty">
            Selecione tags governadas ao criar o projeto para ativar recomendacoes futuras.
          </span>
        </div>
        <div class="project-cockpit__tag-strip">
          <span class="project-cockpit__tag-label">Tags herdadas dos entregaveis</span>
          <div v-if="visibleInheritedTags.length" class="project-cockpit__tag-list">
            <v-menu
              v-for="tag in visibleInheritedTags"
              :key="tag.id"
              location="bottom"
              open-on-hover
              :close-on-content-click="false"
            >
              <template #activator="{ props: menuProps }">
                <v-chip v-bind="menuProps" color="teal" variant="tonal" size="small">
                  {{ tag.name }}
                  <span class="project-cockpit__tag-count">{{ tag.deliverables.length }}</span>
                </v-chip>
              </template>
              <v-card class="project-cockpit__tag-popover" rounded="lg">
                <strong>{{ tag.name }}</strong>
                <span>{{ inheritedTagOrigin(tag) }}</span>
              </v-card>
            </v-menu>
            <v-chip v-if="hiddenInheritedTagsCount" color="teal" variant="outlined" size="small">
              +{{ hiddenInheritedTagsCount }} tag(s)
            </v-chip>
          </div>
          <span v-else class="project-cockpit__tag-empty">
            Tags aparecem aqui quando forem vinculadas aos entregaveis.
          </span>
        </div>
      </div>
      <div class="project-cockpit__hero-actions">
        <v-progress-circular :model-value="project.progress" color="teal" size="88" width="9">
          {{ project.progress }}%
        </v-progress-circular>
        <v-btn
          href="#project-knowledge"
          color="teal"
          variant="flat"
          prepend-icon="$command"
        >
          Gerenciar knowledge
        </v-btn>
        <v-btn color="teal" variant="tonal" prepend-icon="$upload" @click="isDocumentModalOpen = true">
          Novo documento
        </v-btn>
        <v-btn :to="`/projects/${project.id}/deliverables`" color="indigo" variant="tonal" prepend-icon="$calendar">
          Entregaveis
        </v-btn>
        <TraceableLinkButton :path="`/projects/${project.id}`" label="Link do projeto" />
      </div>
    </section>

    <v-sheet border rounded="xl" class="project-cockpit__tabs-shell">
      <v-tabs v-model="activeTab" color="teal" class="project-cockpit__tabs">
        <v-tab v-for="tab in tabItems" :key="tab.value" :value="tab.value">
          {{ tab.title }}
          <v-chip size="x-small" variant="tonal" color="teal" class="ml-2">{{ tab.count }}</v-chip>
        </v-tab>
      </v-tabs>
    </v-sheet>

    <v-window v-model="activeTab" class="project-cockpit__window">
      <v-window-item value="overview">
        <section class="project-cockpit__tab-panel">
          <InheritedDeliverablesReviewBanner
            :project-id="project.id"
            :deliverables="deliverables"
            :can-approve-removal="canApproveDeliverableRemoval"
            :saving-ids="inheritanceReviewSavingIds"
            @mark-reviewed="markInheritedDeliverableReviewed"
            @request-removal="removeInheritedDeliverable"
            @approve-removal="approveInheritedDeliverableRemoval"
            @reject-removal="rejectInheritedDeliverableRemoval"
          />

          <section class="project-cockpit__metrics" aria-label="Indicadores rapidos">
            <v-sheet
              v-for="metric in metrics"
              :key="metric.label"
              border
              rounded="lg"
              class="project-cockpit__metric"
              :class="{ 'project-cockpit__metric--emphasis': metric.emphasis }"
              :data-color="metric.color"
            >
              <i aria-hidden="true" />
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.detail }}</small>
            </v-sheet>
          </section>

          <v-sheet border rounded="lg" class="project-cockpit__panel project-cockpit__technical-context">
            <div class="project-cockpit__panel-head">
              <div>
                <h2>Contexto tecnico do projeto</h2>
                <p>Leitura inicial a partir das tags governadas vinculadas ao projeto.</p>
              </div>
            </div>
            <div v-if="visibleTechnicalProfileTags.length" class="project-cockpit__tag-list">
              <v-chip
                v-for="tag in visibleTechnicalProfileTags"
                :key="tag.id"
                color="teal"
                variant="tonal"
                size="small"
              >
                {{ tag.name }}
              </v-chip>
              <v-chip v-if="hiddenTechnicalProfileTagsCount" color="teal" variant="outlined" size="small">
                +{{ hiddenTechnicalProfileTagsCount }} tag(s)
              </v-chip>
            </div>
            <span v-else class="project-cockpit__tag-empty">
              Adicione tags governadas ao projeto para criar contexto tecnico reutilizavel.
            </span>
          </v-sheet>

          <section class="project-cockpit__value-grid" aria-label="Foco de valor do projeto">
            <v-sheet border rounded="xl" class="project-cockpit__value-card project-cockpit__value-card--knowledge">
              <span>Base de conhecimento em destaque</span>
              <h2>Use o que a equipe ja aprendeu para acelerar este projeto.</h2>
              <p>{{ knowledgeValueLabel }}. Conhecimentos aplicados viram contexto, recomendacao e decisao mais segura para a engenharia.</p>
              <div class="project-cockpit__value-actions">
                <v-btn color="teal" variant="flat" prepend-icon="$command" href="#project-knowledge">
                  Gerenciar knowledge
                </v-btn>
                <v-btn to="/knowledge-base" color="teal" variant="tonal">
                  Abrir base
                </v-btn>
              </div>
            </v-sheet>

            <v-sheet border rounded="xl" class="project-cockpit__value-card project-cockpit__value-card--deliverables">
              <span>Entregaveis como eixo operacional</span>
              <h2>{{ deliverableFocusLabel }}</h2>
              <p>Documentos, revisoes, prazos e responsaveis aparecem conectados para transformar cada entregavel em ponto claro de acao.</p>
              <div class="project-cockpit__value-actions">
                <v-btn color="indigo" variant="flat" prepend-icon="$calendar" @click="activeTab = 'deliverables'">
                  Ver entregaveis
                </v-btn>
              </div>
            </v-sheet>
          </section>

          <section class="project-cockpit__split project-cockpit__split--wide">
            <v-sheet border rounded="lg" class="project-cockpit__panel">
              <div class="project-cockpit__panel-head">
                <div>
                  <h2>Entregaveis em foco</h2>
                  <p>Resumo compacto dos pontos que mais merecem acao agora.</p>
                </div>
                <v-btn size="small" color="teal" variant="text" @click="activeTab = 'deliverables'">Ver todos</v-btn>
              </div>
              <div v-if="featuredDeliverables.length" class="project-cockpit__focus-list">
                <v-sheet
                  v-for="deliverable in featuredDeliverables"
                  :key="deliverable.id"
                  border
                  rounded="lg"
                  class="project-cockpit__focus-card"
                >
                  <div>
                    <strong>{{ deliverable.title }}</strong>
                    <span>{{ deliverable.dueDate ? formatRelativeDueDate(deliverable.dueDate) : 'Sem prazo definido' }}</span>
                  </div>
                  <BaseStatusBadge :kind="deliverableBadgeKind(deliverable.status)" size="x-small" />
                  <div class="project-cockpit__focus-tags">
                    <v-chip
                      v-for="tag in (deliverable.tags ?? []).slice(0, 3)"
                      :key="tag.id"
                      size="x-small"
                      color="teal"
                      variant="tonal"
                    >
                      {{ tag.name }}
                    </v-chip>
                    <small v-if="!(deliverable.tags ?? []).length">Sem tags tecnicas</small>
                  </div>
                </v-sheet>
              </div>
              <v-empty-state
                v-else
                headline="Sem entregaveis tecnicos"
                text="Cadastre entregaveis para transformar o projeto em um cockpit operacional rastreavel."
              />
            </v-sheet>

            <v-sheet border rounded="lg" class="project-cockpit__panel">
              <div class="project-cockpit__panel-head">
                <div>
                  <h2>Recomendacoes contextuais</h2>
                  <p>Sugestoes baseadas no contexto tecnico deste projeto.</p>
                </div>
              </div>
              <div class="project-cockpit__recommendations">
                <v-sheet
                  v-for="recommendation in knowledgeRecommendations"
                  :key="recommendation.knowledgeItem.id"
                  border
                  rounded="lg"
                  class="project-cockpit__recommendation project-cockpit__recommendation--knowledge"
                  :class="{ 'project-cockpit__recommendation--applied': recommendation.alreadyApplied }"
                >
                  <div class="project-cockpit__recommendation-head">
                    <div>
                      <span>{{ recommendationTypeLabel(recommendation.type) }}</span>
                      <strong>{{ recommendation.knowledgeItem.title }}</strong>
                    </div>
                    <v-chip color="teal" variant="tonal" size="small">
                      Forca {{ recommendation.score }}
                    </v-chip>
                  </div>
                  <p>{{ recommendation.reason }}</p>
                  <div class="project-cockpit__recommendation-tags">
                    <v-chip
                      v-for="tag in recommendation.matchedTags.slice(0, 4)"
                      :key="tag.id"
                      size="small"
                      color="teal"
                      variant="tonal"
                    >
                      {{ tag.name }}
                    </v-chip>
                  </div>
                  <div class="project-cockpit__recommendation-actions">
                    <v-chip v-if="recommendation.alreadyApplied" color="green" variant="tonal" size="small">
                      Ja aplicado
                    </v-chip>
                    <v-btn
                      v-else
                      size="small"
                      color="teal"
                      variant="flat"
                      :loading="contextualRecommendationSavingIds.includes(recommendation.knowledgeItem.id)"
                      @click="applyKnowledgeRecommendation(recommendation)"
                    >
                      Aplicar ao projeto
                    </v-btn>
                    <v-btn :to="`/knowledge-base/${recommendation.knowledgeItem.id}`" size="small" color="teal" variant="tonal">
                      Abrir detalhe
                    </v-btn>
                  </div>
                </v-sheet>
                <v-sheet
                  v-for="recommendation in recommendations"
                  :key="recommendation.title"
                  border
                  rounded="lg"
                  class="project-cockpit__recommendation"
                >
                  <strong>{{ recommendation.title }}</strong>
                  <span>{{ recommendation.description }}</span>
                  <v-btn v-if="recommendation.to" :to="recommendation.to" size="small" color="teal" variant="tonal">
                    {{ recommendation.actionLabel }}
                  </v-btn>
                </v-sheet>
                <v-empty-state
                  v-if="recommendations.length === 0 && knowledgeRecommendations.length === 0"
                  headline="Sem recomendacoes agora"
                  text="Quando entregaveis tiverem tags tecnicas, a plataforma passa a sugerir knowledge relevante automaticamente."
                />
              </div>
            </v-sheet>
          </section>

          <div id="project-knowledge" class="project-cockpit__knowledge-anchor">
            <ProjectKnowledgeSection :project-id="project.id" :deliverables="deliverables" />
          </div>
        </section>
      </v-window-item>

      <v-window-item value="deliverables">
        <section class="project-cockpit__tab-panel project-cockpit__section--deliverables">
          <InheritedDeliverablesReviewBanner
            :project-id="project.id"
            :deliverables="deliverables"
            :can-approve-removal="canApproveDeliverableRemoval"
            :saving-ids="inheritanceReviewSavingIds"
            @mark-reviewed="markInheritedDeliverableReviewed"
            @request-removal="removeInheritedDeliverable"
            @approve-removal="approveInheritedDeliverableRemoval"
            @reject-removal="rejectInheritedDeliverableRemoval"
          />

          <div class="project-cockpit__section-title">
            <div>
              <h2>Entregaveis tecnicos</h2>
              <p>Visao completa, com documentos, revisoes, tags e knowledge aplicado.</p>
            </div>
            <v-btn :to="`/projects/${project.id}/deliverables`" color="teal" variant="tonal">
              Gerenciar entregaveis
            </v-btn>
          </div>
          <div v-if="deliverables.length" class="project-cockpit__deliverable-cards">
            <ProjectDeliverableTechnicalCard
              v-for="deliverable in deliverables"
              :key="deliverable.id"
              :deliverable="deliverable"
              :documents="documents"
              :reviews="reviews"
              :knowledge-items="knowledgeItems"
              @update:status="updateDeliverableStatus"
            />
          </div>
          <DeliverablesBoard v-if="deliverables.length" :deliverables="deliverables" @update:status="updateDeliverableStatus" />
          <v-empty-state
            v-else
            headline="Sem entregaveis tecnicos"
            text="Cadastre entregaveis para conectar tags, documentos e conhecimento aplicado."
          />
        </section>
      </v-window-item>

      <v-window-item value="documents">
        <section class="project-cockpit__tab-panel">
          <v-sheet border rounded="lg" class="project-cockpit__panel">
            <div class="project-cockpit__panel-head">
              <div>
                <h2>Documentos</h2>
                <p>Versoes oficiais, minutas e documentos em revisao vinculados ao projeto.</p>
              </div>
              <v-btn color="teal" variant="flat" prepend-icon="$upload" @click="isDocumentModalOpen = true">Novo documento</v-btn>
            </div>
            <v-list lines="two" bg-color="transparent">
              <v-list-item
                v-for="document in documents"
                :key="document.id"
                :title="document.title"
                :subtitle="document.officialVersion?.revision ? `Oficial ${document.officialVersion.revision}` : document.description || 'Sem versao oficial'"
              >
                <template #append>
                  <BaseStatusBadge :kind="documentBadgeKind(document.status)" size="x-small" />
                </template>
              </v-list-item>
              <v-list-item v-if="documents.length === 0" title="Sem documentos cadastrados" />
            </v-list>
          </v-sheet>
        </section>
      </v-window-item>

      <v-window-item value="reviews">
        <section class="project-cockpit__tab-panel">
          <v-sheet border rounded="lg" class="project-cockpit__panel">
            <div class="project-cockpit__panel-head">
              <div>
                <h2>Revisoes</h2>
                <p>Pendencias, aprovacoes e reprovacoes tecnicas.</p>
              </div>
              <v-btn to="/reviews" size="small" variant="text" color="teal">Abrir revisoes</v-btn>
            </div>
            <v-list lines="two" bg-color="transparent">
              <v-list-item
                v-for="review in reviews"
                :key="review.id"
                :title="review.comment || 'Revisao tecnica'"
                :subtitle="review.dueDate ? formatRelativeDueDate(review.dueDate) : 'Sem prazo de revisao'"
              >
                <template #append>
                  <BaseStatusBadge :kind="reviewBadgeKind(review.status)" size="x-small" />
                </template>
              </v-list-item>
              <v-list-item v-if="reviews.length === 0" title="Sem revisoes cadastradas" />
            </v-list>
          </v-sheet>
        </section>
      </v-window-item>

      <v-window-item value="history">
        <section class="project-cockpit__tab-panel project-cockpit__split">
          <v-sheet border rounded="lg" class="project-cockpit__panel">
            <div class="project-cockpit__panel-head">
              <div>
                <h2>Riscos e aprendizados</h2>
                <p>Sinais de retrabalho, atraso ou falta de referencia tecnica.</p>
              </div>
            </div>
            <div class="project-cockpit__risks">
              <v-alert
                v-for="risk in riskItems"
                :key="risk.title"
                :type="risk.tone"
                variant="tonal"
                density="comfortable"
              >
                <strong>{{ risk.title }}</strong>
                <div>{{ risk.description }}</div>
              </v-alert>
              <v-alert v-if="riskItems.length === 0" type="success" variant="tonal">
                Nenhum risco tecnico evidente com os dados atuais.
              </v-alert>
            </div>
          </v-sheet>
          <v-sheet border rounded="lg" class="project-cockpit__history">
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="entry in recentHistory"
                :key="entry.id"
                dot-color="teal"
                size="small"
              >
                <strong>{{ entry.description }}</strong>
                <div>{{ entry.actorDisplayName || entry.actorName }} · {{ formatDateTime(entry.occurredAt) }}</div>
              </v-timeline-item>
            </v-timeline>
            <v-empty-state
              v-if="recentHistory.length === 0"
              headline="Sem historico recente"
              text="Eventos auditaveis do projeto aparecerao aqui."
            />
          </v-sheet>
        </section>
      </v-window-item>
    </v-window>

    <v-dialog v-model="isDocumentModalOpen" max-width="780" scrollable>
      <DocumentUpload
        :projects="[project]"
        :deliverables="deliverables"
        :saving="isSavingDocument"
        :initial-project-id="project.id"
        locked-project
        @submit="handleDocumentSubmit"
      />
    </v-dialog>

    <v-dialog :model-value="Boolean(removalDialog)" max-width="560" @update:model-value="!$event && (removalDialog = null)">
      <v-card rounded="lg">
        <v-card-title>
          {{
            removalDialog?.mode === 'approve'
              ? 'Aprovar remocao'
              : removalDialog?.mode === 'reject'
                ? 'Rejeitar remocao'
                : 'Solicitar remocao'
          }}
        </v-card-title>
        <v-card-text class="project-cockpit__removal-dialog">
          <p>
            {{ removalDialog?.deliverable.title }}
          </p>
          <v-alert type="warning" variant="tonal">
            Remover entregavel altera a estrutura tecnica deste projeto. A base original nao sera afetada, mas a decisao ficara registrada no historico.
          </v-alert>
          <v-textarea
            v-model="removalReason"
            :label="removalDialog?.mode === 'request' ? 'Motivo tecnico da remocao' : 'Comentario da decisao'"
            rows="4"
            counter="1000"
            maxlength="1000"
            variant="outlined"
            :hint="removalDialog?.mode === 'request' ? 'Explique por que este entregavel nao se aplica ao projeto.' : 'Opcional: registre o criterio usado na decisao.'"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="removalDialog = null">Cancelar</v-btn>
          <v-spacer />
          <v-btn
            color="red"
            variant="flat"
            :disabled="removalDialog?.mode === 'request' && removalReason.trim().length < 12"
            :loading="Boolean(removalDialog && inheritanceReviewSavingIds.includes(removalDialog.deliverable.id))"
            @click="submitRemovalDialog"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.project-cockpit {
  display: grid;
  gap: 1.25rem;
}

.project-cockpit__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 18rem);
  gap: 1.25rem;
  align-items: center;
  border: 1px solid #b9ddd2;
  border-radius: 1rem;
  background:
    radial-gradient(circle at top left, rgb(39 115 101 / 0.18), transparent 28rem),
    linear-gradient(135deg, #ffffff, #f4fbf8 62%, #e8f7f1);
  padding: 1.25rem;
  box-shadow: 0 18px 42px rgb(15 45 38 / 0.09);
}

.project-cockpit__hero-copy {
  min-width: 0;
}

.project-cockpit__eyebrow {
  color: #267365;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.project-cockpit__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.project-cockpit__title-row h1 {
  margin: 0.15rem 0;
  color: #14231f;
  font-size: 2rem;
  line-height: 1.15;
}

.project-cockpit__hero-copy p,
.project-cockpit__section-title p,
.project-cockpit__panel-head p {
  margin: 0;
  color: #60716b;
}

.project-cockpit__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin-top: 0.85rem;
  color: #60716b;
  font-size: 0.9rem;
}

.project-cockpit__meta strong {
  color: #1b332c;
}

.project-cockpit__tag-strip {
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
  border: 1px solid #c9e7dc;
  border-radius: 0.95rem;
  background: rgb(255 255 255 / 0.62);
  padding: 0.75rem;
}

.project-cockpit__tag-label {
  color: #267365;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.project-cockpit__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.project-cockpit__tag-count {
  display: inline-grid;
  min-width: 1.15rem;
  min-height: 1.15rem;
  margin-left: 0.35rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(0 150 136 / 0.16);
  color: #0f5b50;
  font-size: 0.68rem;
  font-weight: 900;
}

.project-cockpit__tag-empty {
  color: #60716b;
  font-size: 0.84rem;
}

.project-cockpit__tag-popover {
  display: grid;
  gap: 0.25rem;
  max-width: 20rem;
  padding: 0.8rem;
}

.project-cockpit__tag-popover strong {
  color: #14231f;
}

.project-cockpit__tag-popover span {
  color: #60716b;
  font-size: 0.86rem;
}

.project-cockpit__hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.project-cockpit__hero-actions :deep(.v-btn) {
  max-width: 100%;
}

.project-cockpit__tabs-shell {
  overflow-x: auto;
  border-color: #cfe7de;
  background:
    linear-gradient(135deg, rgb(232 248 242 / 0.9), #ffffff),
    #ffffff;
  padding: 0 0.5rem;
  box-shadow: 0 12px 26px rgb(15 45 38 / 0.06);
}

.project-cockpit__tabs {
  min-width: max-content;
}

.project-cockpit__window {
  overflow: visible;
}

.project-cockpit__tab-panel {
  display: grid;
  gap: 1.25rem;
}

.project-cockpit__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  gap: 0.75rem;
}

.project-cockpit__metric {
  position: relative;
  display: grid;
  gap: 0.28rem;
  min-height: 6.6rem;
  overflow: hidden;
  border-color: color-mix(in srgb, var(--metric-accent) 28%, #d8e5df);
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--metric-accent) 15%, #ffffff), #ffffff 68%),
    #ffffff;
  padding: 0.9rem;
  box-shadow: 0 12px 26px rgb(15 45 38 / 0.06);
}

.project-cockpit__metric[data-color='teal'] {
  --metric-accent: #009688;
}

.project-cockpit__metric[data-color='green'] {
  --metric-accent: #2e7d50;
}

.project-cockpit__metric[data-color='red'] {
  --metric-accent: #d1493f;
}

.project-cockpit__metric[data-color='amber'] {
  --metric-accent: #d9901f;
}

.project-cockpit__metric[data-color='purple'] {
  --metric-accent: #6750a4;
}

.project-cockpit__metric[data-color='blue'] {
  --metric-accent: #2474a6;
}

.project-cockpit__metric i {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 0.28rem;
  background: var(--metric-accent);
}

.project-cockpit__metric::after {
  position: absolute;
  right: -1.25rem;
  bottom: -1.75rem;
  width: 4.6rem;
  height: 4.6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--metric-accent) 18%, transparent);
  content: '';
}

.project-cockpit__metric--emphasis {
  transform: translateY(-0.15rem);
  box-shadow: 0 18px 36px color-mix(in srgb, var(--metric-accent) 18%, transparent);
}

.project-cockpit__metric span,
.project-cockpit__summary-card span {
  color: color-mix(in srgb, var(--metric-accent, #267365) 70%, #60716b);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.project-cockpit__metric strong {
  color: color-mix(in srgb, var(--metric-accent, #14231f) 72%, #14231f);
  font-size: 2rem;
  line-height: 1;
}

.project-cockpit__metric small,
.project-cockpit__summary-card small {
  color: #60716b;
}

.project-cockpit__section,
.project-cockpit__panel {
  display: grid;
  gap: 1rem;
}

.project-cockpit__value-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
  gap: 1rem;
}

.project-cockpit__value-card {
  display: grid;
  align-content: start;
  gap: 0.75rem;
  min-height: 15rem;
  padding: 1.25rem;
  box-shadow: 0 18px 42px rgb(15 45 38 / 0.08);
}

.project-cockpit__value-card--knowledge {
  border-color: #9bd9cb;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.2), transparent 18rem),
    linear-gradient(135deg, #10342d, #146052 56%, #e8fbf4);
}

.project-cockpit__value-card--deliverables {
  border-color: #c6c1ef;
  background:
    radial-gradient(circle at top right, rgb(103 80 164 / 0.22), transparent 18rem),
    linear-gradient(135deg, #ffffff, #f7f4ff 72%, #eef8f4);
}

.project-cockpit__value-card span {
  color: #d7f2e7;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.project-cockpit__value-card--deliverables span {
  color: #6750a4;
}

.project-cockpit__value-card h2 {
  max-width: 42rem;
  margin: 0;
  color: #ffffff;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.12;
}

.project-cockpit__value-card--deliverables h2 {
  color: #241d42;
}

.project-cockpit__value-card p {
  max-width: 44rem;
  margin: 0;
  color: rgb(255 255 255 / 0.82);
}

.project-cockpit__value-card--deliverables p {
  color: #5e5a72;
}

.project-cockpit__value-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.project-cockpit__section-title,
.project-cockpit__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.project-cockpit__section-title h2,
.project-cockpit__panel-head h2 {
  margin: 0 0 0.25rem;
  color: #14231f;
  font-size: 1.2rem;
}

.project-cockpit__summary-grid,
.project-cockpit__split {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.project-cockpit__split {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-cockpit__split--wide {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.project-cockpit__summary-card,
.project-cockpit__panel,
.project-cockpit__history {
  background: #ffffff;
  padding: 1rem;
}

.project-cockpit__summary-card {
  display: grid;
  gap: 0.35rem;
  border-color: #d7e9e2;
  background:
    linear-gradient(135deg, rgb(232 248 242 / 0.72), #ffffff 58%),
    #ffffff;
  box-shadow: 0 10px 24px rgb(15 45 38 / 0.05);
}

.project-cockpit__summary-card strong {
  color: #14231f;
  font-size: 1rem;
}

.project-cockpit__deliverable-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
  gap: 1rem;
}

.project-cockpit__focus-list {
  display: grid;
  gap: 0.7rem;
}

.project-cockpit__focus-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: start;
  border-color: #d7e9e2;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.1), transparent 10rem),
    #ffffff;
  padding: 0.85rem;
}

.project-cockpit__focus-card strong {
  display: block;
  color: #14231f;
}

.project-cockpit__focus-card span,
.project-cockpit__focus-card small {
  color: #60716b;
  font-size: 0.86rem;
}

.project-cockpit__focus-tags {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.project-cockpit__flow-panel {
  border: 1px solid #d7e9e2;
  border-radius: 1rem;
  overflow: hidden;
}

.project-cockpit__knowledge-anchor {
  scroll-margin-top: 5rem;
}

.project-cockpit__section--deliverables {
  border: 1px solid #c8dff7;
  border-radius: 1rem;
  background:
    linear-gradient(135deg, rgb(241 247 255 / 0.92), rgb(255 255 255 / 0.72)),
    #ffffff;
  padding: 1rem;
  box-shadow: 0 16px 34px rgb(31 54 92 / 0.06);
}

.project-cockpit__recommendations,
.project-cockpit__risks {
  display: grid;
  gap: 0.75rem;
}

.project-cockpit__recommendation {
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem;
}

.project-cockpit__recommendation--knowledge {
  border-color: #9bd9cb;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.16), transparent 12rem),
    linear-gradient(135deg, #f2fffb, #ffffff 62%);
  box-shadow: 0 14px 28px rgb(15 45 38 / 0.07);
}

.project-cockpit__recommendation--applied {
  border-color: #badfca;
  background:
    linear-gradient(135deg, #f5fff8, #ffffff 68%),
    #ffffff;
}

.project-cockpit__recommendation-head {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.project-cockpit__recommendation-head > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.project-cockpit__recommendation-head span {
  color: #267365;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.project-cockpit__recommendation strong {
  color: #14231f;
  overflow-wrap: anywhere;
}

.project-cockpit__recommendation span,
.project-cockpit__recommendation p {
  margin: 0;
  color: #60716b;
}

.project-cockpit__recommendation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.project-cockpit__recommendation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.project-cockpit__history {
  overflow: hidden;
}

@media (max-width: 1280px) {
  .project-cockpit__deliverable-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .project-cockpit__hero,
  .project-cockpit__value-grid,
  .project-cockpit__split--wide {
    grid-template-columns: 1fr;
  }

  .project-cockpit__hero {
    align-items: start;
  }

  .project-cockpit__hero-actions {
    justify-content: start;
  }
}

@media (max-width: 960px) {
  .project-cockpit__summary-grid,
  .project-cockpit__split,
  .project-cockpit__split--wide,
  .project-cockpit__value-grid,
  .project-cockpit__deliverable-cards {
    grid-template-columns: 1fr;
  }

  .project-cockpit__hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .project-cockpit__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-cockpit__hero {
    padding: 1rem;
  }

  .project-cockpit__title-row h1 {
    font-size: 1.55rem;
  }

  .project-cockpit__hero-actions {
    grid-template-columns: 1fr;
  }

  .project-cockpit__hero-actions :deep(.v-progress-circular) {
    justify-self: start;
  }

  .project-cockpit__section-title,
  .project-cockpit__panel-head {
    display: grid;
  }
}

@media (max-width: 520px) {
  .project-cockpit {
    gap: 1rem;
  }

  .project-cockpit__metrics {
    grid-template-columns: 1fr;
  }

  .project-cockpit__tag-strip,
  .project-cockpit__panel,
  .project-cockpit__summary-card,
  .project-cockpit__history,
  .project-cockpit__section--deliverables {
    padding: 0.85rem;
  }
}
</style>
