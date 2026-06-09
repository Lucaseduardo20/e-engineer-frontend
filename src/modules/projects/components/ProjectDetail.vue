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
import ProjectDeliverableTechnicalCard from './ProjectDeliverableTechnicalCard.vue'

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
        :class="{ 'project-cockpit__metric--emphasis': metric.emphasis }"
        :data-color="metric.color"
      >
        <i aria-hidden="true" />
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.detail }}</small>
      </v-sheet>
    </section>

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
          <v-btn :to="`/projects/${project.id}/deliverables`" color="indigo" variant="flat" prepend-icon="$calendar">
            Operar entregaveis
          </v-btn>
        </div>
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

    <div id="project-knowledge" class="project-cockpit__knowledge-anchor">
      <ProjectKnowledgeSection :project-id="project.id" :deliverables="deliverables" />
    </div>

    <section class="project-cockpit__section project-cockpit__section--deliverables">
      <div class="project-cockpit__section-title">
        <div>
          <h2>Entregaveis tecnicos</h2>
          <p>Eixo operacional do projeto: prazos, documentos, revisoes, responsaveis e knowledge aplicado.</p>
        </div>
        <v-btn :to="`/projects/${project.id}/deliverables`" color="teal" variant="tonal">
          Abrir entregaveis
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
      <v-empty-state
        v-else
        headline="Sem entregaveis tecnicos"
        text="Cadastre entregaveis para transformar o projeto em um cockpit operacional rastreavel."
      />
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
  border: 1px solid #b9ddd2;
  border-radius: 1rem;
  background:
    radial-gradient(circle at top left, rgb(39 115 101 / 0.18), transparent 28rem),
    linear-gradient(135deg, #ffffff, #f4fbf8 62%, #e8f7f1);
  padding: 1.25rem;
  box-shadow: 0 18px 42px rgb(15 45 38 / 0.09);
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
  position: relative;
  display: grid;
  gap: 0.28rem;
  min-height: 7rem;
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
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
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
  .project-cockpit__split,
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

  .project-cockpit__section-title,
  .project-cockpit__panel-head {
    display: grid;
  }
}
</style>
