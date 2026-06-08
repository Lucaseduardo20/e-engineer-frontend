<script setup lang="ts">
import { computed } from 'vue'
import type {
  AuditLogEntry,
  Deliverable,
  DocumentSummary,
  Project,
  ProjectKnowledgeItem,
  ReviewSummary,
} from '@/shared/types/api-contracts'
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
import ProjectKnowledgeSection from './ProjectKnowledgeSection.vue'

const props = defineProps<{
  project: Project
  deliverables: Deliverable[]
  documents: DocumentSummary[]
  reviews: ReviewSummary[]
  knowledgeItems: ProjectKnowledgeItem[]
  auditLogs: AuditLogEntry[]
}>()

const emit = defineEmits<{
  'update:deliverable-status': [deliverable: Deliverable, status: Deliverable['status']]
}>()

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
const nextDueDeliverable = computed(() =>
  [...activeDeliverables.value]
    .filter((deliverable) => Boolean(deliverable.dueDate))
    .sort((first, second) => (toTimestamp(first.dueDate) ?? 0) - (toTimestamp(second.dueDate) ?? 0))[0],
)
const recommendationCount = computed(() => recommendations.value.length)
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
  },
  {
    label: 'Entregaveis atrasados',
    value: overdueDeliverables.value.length,
    detail: overdueDeliverables.value.length ? 'pedem atencao' : 'sem atraso',
    color: overdueDeliverables.value.length ? 'error' : 'green',
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
    color: pendingReviews.value.length ? 'warning' : 'green',
  },
  {
    label: 'Revisoes reprovadas',
    value: rejectedReviews.value.length,
    detail: rejectedReviews.value.length ? 'geram aprendizado' : 'sem reprovacao',
    color: rejectedReviews.value.length ? 'error' : 'green',
  },
  {
    label: 'Conhecimentos aplicados',
    value: props.knowledgeItems.length,
    detail: props.knowledgeItems.length ? 'referencias vinculadas' : 'nenhum vinculo',
    color: 'indigo',
  },
  {
    label: 'Recomendacoes',
    value: recommendationCount.value,
    detail: recommendationCount.value ? 'acoes sugeridas' : 'sem sugestoes',
    color: 'blue',
  },
])
const recentDocuments = computed(() => props.documents.slice(0, 5))
const recentReviews = computed(() => props.reviews.slice(0, 5))
const recentHistory = computed(() => props.auditLogs.slice(0, 6))

function updateDeliverableStatus(deliverable: Deliverable, status: Deliverable['status']) {
  emit('update:deliverable-status', deliverable, status)
}

function firstAssignee() {
  return props.deliverables.flatMap((deliverable) => deliverable.assignees)[0]
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
      </div>
      <div class="project-cockpit__hero-actions">
        <v-progress-circular :model-value="project.progress" color="teal" size="88" width="9">
          {{ project.progress }}%
        </v-progress-circular>
        <v-btn
          :to="`/projects/${project.id}/deliverables`"
          color="teal"
          variant="flat"
          prepend-icon="$calendar"
        >
          Gerenciar entregaveis
        </v-btn>
        <v-btn to="/documents" color="teal" variant="tonal" prepend-icon="$file">
          Documentos
        </v-btn>
        <TraceableLinkButton :path="`/projects/${project.id}`" label="Link do projeto" />
      </div>
    </section>

    <section class="project-cockpit__metrics" aria-label="Indicadores rapidos">
      <v-sheet
        v-for="metric in metrics"
        :key="metric.label"
        border
        rounded="lg"
        class="project-cockpit__metric"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.detail }}</small>
      </v-sheet>
    </section>

    <section class="project-cockpit__section">
      <div class="project-cockpit__section-title">
        <div>
          <h2>Resumo operacional</h2>
          <p>Leitura rapida da saude tecnica e do proximo gargalo do projeto.</p>
        </div>
      </div>
      <div class="project-cockpit__summary-grid">
        <v-sheet border rounded="lg" class="project-cockpit__summary-card">
          <span>Proxima entrega</span>
          <strong>{{ nextDueDeliverable?.title ?? 'Nenhum entregavel com prazo' }}</strong>
          <small>{{ nextDueDeliverable ? formatShortDate(nextDueDeliverable.dueDate) : 'Cadastre prazos para orientar o cockpit.' }}</small>
        </v-sheet>
        <v-sheet border rounded="lg" class="project-cockpit__summary-card">
          <span>Tipo tecnico</span>
          <strong>{{ project.projectType || 'Nao informado' }}</strong>
          <small>{{ project.tags?.length ? project.tags.join(', ') : 'Sem tags legadas no projeto' }}</small>
        </v-sheet>
        <v-sheet border rounded="lg" class="project-cockpit__summary-card">
          <span>Foco atual</span>
          <strong>{{ pendingReviews.length ? 'Destravar revisoes' : activeDeliverables.length ? 'Executar entregaveis' : 'Consolidar fechamento' }}</strong>
          <small>{{ riskItems.length ? `${riskItems.length} ponto(s) de atencao` : 'Sem risco operacional evidente' }}</small>
        </v-sheet>
      </div>
    </section>

    <section class="project-cockpit__section">
      <div class="project-cockpit__section-title">
        <div>
          <h2>Entregaveis</h2>
          <p>Fluxo de producao tecnica organizado por etapa.</p>
        </div>
        <v-btn :to="`/projects/${project.id}/deliverables`" color="teal" variant="tonal">
          Abrir entregaveis
        </v-btn>
      </div>
      <DeliverablesBoard :deliverables="deliverables" @update:status="updateDeliverableStatus" />
    </section>

    <section class="project-cockpit__split">
      <v-sheet border rounded="lg" class="project-cockpit__panel">
        <div class="project-cockpit__panel-head">
          <div>
            <h2>Documentos</h2>
            <p>Versoes oficiais, minutas e documentos em revisao.</p>
          </div>
          <v-btn to="/documents" size="small" variant="text" color="teal">Abrir</v-btn>
        </div>
        <v-list lines="two" bg-color="transparent">
          <v-list-item
            v-for="document in recentDocuments"
            :key="document.id"
            :title="document.title"
            :subtitle="document.officialVersion?.revision ? `Oficial ${document.officialVersion.revision}` : document.description || 'Sem versao oficial'"
          >
            <template #append>
              <BaseStatusBadge :kind="documentBadgeKind(document.status)" size="x-small" />
            </template>
          </v-list-item>
          <v-list-item v-if="recentDocuments.length === 0" title="Sem documentos cadastrados" />
        </v-list>
      </v-sheet>

      <v-sheet border rounded="lg" class="project-cockpit__panel">
        <div class="project-cockpit__panel-head">
          <div>
            <h2>Revisoes</h2>
            <p>Pendencias, aprovacoes e reprovacoes tecnicas.</p>
          </div>
          <v-btn to="/reviews" size="small" variant="text" color="teal">Abrir</v-btn>
        </div>
        <v-list lines="two" bg-color="transparent">
          <v-list-item
            v-for="review in recentReviews"
            :key="review.id"
            :title="review.comment || 'Revisao tecnica'"
            :subtitle="review.dueDate ? formatRelativeDueDate(review.dueDate) : 'Sem prazo de revisao'"
          >
            <template #append>
              <BaseStatusBadge :kind="reviewBadgeKind(review.status)" size="x-small" />
            </template>
          </v-list-item>
          <v-list-item v-if="recentReviews.length === 0" title="Sem revisoes cadastradas" />
        </v-list>
      </v-sheet>
    </section>

    <ProjectKnowledgeSection :project-id="project.id" />

    <section class="project-cockpit__split">
      <v-sheet border rounded="lg" class="project-cockpit__panel">
        <div class="project-cockpit__panel-head">
          <div>
            <h2>Recomendacoes</h2>
            <p>Acoes sugeridas a partir do estado atual do projeto.</p>
          </div>
        </div>
        <div class="project-cockpit__recommendations">
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
            v-if="recommendations.length === 0"
            headline="Sem recomendacoes agora"
            text="O projeto nao apresenta lacunas operacionais evidentes."
          />
        </div>
      </v-sheet>

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
    </section>

    <section class="project-cockpit__section">
      <div class="project-cockpit__section-title">
        <div>
          <h2>Historico</h2>
          <p>Movimentos auditaveis ligados ao projeto.</p>
        </div>
      </div>
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
  </main>
</template>

<style scoped>
.project-cockpit {
  display: grid;
  gap: 1.25rem;
}

.project-cockpit__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  border: 1px solid #d8e5df;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 14px 30px rgb(15 45 38 / 0.06);
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

.project-cockpit__hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
}

.project-cockpit__metrics {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-cockpit__metric {
  display: grid;
  gap: 0.2rem;
  min-height: 7rem;
  padding: 0.9rem;
}

.project-cockpit__metric span,
.project-cockpit__summary-card span {
  color: #60716b;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.project-cockpit__metric strong {
  color: #14231f;
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

.project-cockpit__summary-card,
.project-cockpit__panel,
.project-cockpit__history {
  background: #ffffff;
  padding: 1rem;
}

.project-cockpit__summary-card {
  display: grid;
  gap: 0.35rem;
}

.project-cockpit__summary-card strong {
  color: #14231f;
  font-size: 1rem;
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

.project-cockpit__recommendation strong {
  color: #14231f;
}

.project-cockpit__recommendation span {
  color: #60716b;
}

.project-cockpit__history {
  overflow: hidden;
}

@media (max-width: 1280px) {
  .project-cockpit__metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .project-cockpit__hero,
  .project-cockpit__summary-grid,
  .project-cockpit__split {
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

  .project-cockpit__section-title,
  .project-cockpit__panel-head {
    display: grid;
  }
}
</style>
