<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import ReviewDetailDialog from '@/modules/reviews/components/ReviewDetailDialog.vue'
import ReviewForm from '@/modules/reviews/components/ReviewForm.vue'
import ReviewsList from '@/modules/reviews/components/ReviewsList.vue'
import { useReviewsStore } from '@/modules/reviews/stores/reviews.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { ReviewStatus, ReviewSummary } from '@/shared/types/api-contracts'

const reviewsStore = useReviewsStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isFormOpen = ref(false)
const isFiltersOpen = ref(false)
const isDetailOpen = ref(false)
const pendingDecision = ref<{ review: ReviewSummary; decision: 'approve' | 'reject' } | null>(null)
const lessonReview = ref<ReviewSummary | null>(null)
const lessonSuccess = ref<string | null>(null)
const createdLessonId = ref<string | null>(null)
const decisionComment = ref('')
const lessonForm = ref({
  title: '',
  context: '',
  identifiedProblem: '',
  impact: '',
  recommendation: '',
  riskObservation: '',
  tags: '',
})
const selectedProjectId = ref<string | null>(null)
const selectedDeliverableId = ref<string | null>(null)
const selectedDocumentId = ref<string | null>(null)
const selectedStatus = ref<ReviewStatus | null>(null)

const statusOptions: Array<{ title: string; value: ReviewStatus }> = [
  { title: 'Pendente', value: 'pending' },
  { title: 'Aprovada', value: 'approved' },
  { title: 'Rejeitada', value: 'rejected' },
  { title: 'Atrasada', value: 'overdue' },
]
const projectOptions = computed(() =>
  reviewsStore.projects.map((project) => ({ title: project.name, value: project.id })),
)
const deliverableOptions = computed(() =>
  reviewsStore.deliverables.map((deliverable) => ({
    title: deliverable.title,
    value: deliverable.id,
  })),
)
const documentOptions = computed(() =>
  reviewsStore.documents.map((document) => ({ title: document.title, value: document.id })),
)
const activeFiltersCount = computed(
  () =>
    [
      selectedProjectId.value,
      selectedDeliverableId.value,
      selectedDocumentId.value,
      selectedStatus.value,
    ].filter(Boolean).length,
)

onMounted(async () => {
  reviewsStore.resetFilters()
  await Promise.all([reviewsStore.loadLookups(), reviewsStore.loadReviews(1, {})])
  await openRouteReview()
})

watch(
  () => route.params.reviewId,
  () => {
    void openRouteReview()
  },
)

function applyFilters() {
  void reviewsStore.loadReviews(1, {
    projectId: selectedProjectId.value ?? undefined,
    deliverableId: selectedDeliverableId.value ?? undefined,
    documentId: selectedDocumentId.value ?? undefined,
    status: selectedStatus.value ?? undefined,
  })
}

function clearFilters() {
  selectedProjectId.value = null
  selectedDeliverableId.value = null
  selectedDocumentId.value = null
  selectedStatus.value = null
  reviewsStore.resetFilters()
  applyFilters()
}

async function handleFilterProjectChange(projectId: string | null) {
  selectedDeliverableId.value = null
  selectedDocumentId.value = null

  if (projectId) {
    await reviewsStore.loadProjectLinks(projectId)
  }
}

async function handleCreate(payload: {
  projectId: string
  deliverableId?: string | null
  documentId?: string | null
  reviewers: string[]
  dueDate?: number | null
  comment?: string | null
}) {
  const created = await reviewsStore.createReview(payload)

  if (created) {
    isFormOpen.value = false
  }
}

function openDecision(review: ReviewSummary, decision: 'approve' | 'reject') {
  decisionComment.value = ''
  pendingDecision.value = { review, decision }
}

async function openReview(review: ReviewSummary) {
  await router.push(`/reviews/${review.id}`)
}

async function openRouteReview() {
  const reviewId = typeof route.params.reviewId === 'string' ? route.params.reviewId : null

  if (!reviewId) {
    isDetailOpen.value = false
    return
  }

  const review = await reviewsStore.loadReview(reviewId)
  isDetailOpen.value = Boolean(review)
}

function updateDetailOpen(value: boolean) {
  isDetailOpen.value = value

  if (!value && route.name === 'review-detail') {
    void router.push('/reviews')
  }
}

async function handleComment(body: string) {
  if (!reviewsStore.selectedReview) {
    return
  }

  await reviewsStore.addComment(reviewsStore.selectedReview.id, body)
}

async function confirmDecision() {
  if (!pendingDecision.value) {
    return
  }

  const { review, decision } = pendingDecision.value
  const payload = { comment: decisionComment.value.trim() || null }
  const updated =
    decision === 'approve'
      ? await reviewsStore.approveReview(review.id, payload)
      : await reviewsStore.rejectReview(review.id, payload)

  if (updated) {
    pendingDecision.value = null

    if (isDetailOpen.value) {
      await reviewsStore.loadReview(review.id)
    }
  }
}

function openLessonForm(review: ReviewSummary) {
  lessonReview.value = review
  lessonForm.value = {
    title: `Licao aprendida: revisao ${review.id.slice(0, 8)}`,
    context: review.comment || `Revisao do projeto ${review.projectId.slice(0, 8)}.`,
    identifiedProblem: review.decisionComment || '',
    impact: '',
    recommendation: '',
    riskObservation: '',
    tags: '',
  }
}

async function submitLesson() {
  if (!auth.can('knowledge.register_lesson')) return
  if (!lessonReview.value) return
  const tags = lessonForm.value.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
  const created = await reviewsStore.registerLessonLearned(lessonReview.value.id, {
    title: lessonForm.value.title.trim(),
    context: lessonForm.value.context.trim(),
    identifiedProblem: lessonForm.value.identifiedProblem.trim(),
    impact: lessonForm.value.impact.trim() || undefined,
    recommendation: lessonForm.value.recommendation.trim(),
    riskObservation: lessonForm.value.riskObservation.trim() || undefined,
    tags,
  })
  if (created) {
    createdLessonId.value = created.id
    lessonSuccess.value = 'Licao aprendida registrada na Base de Conhecimento.'
    lessonReview.value = null
  }
}
</script>

<template>
  <v-container fluid class="reviews-page pa-0">
    <BasePageHeader
      eyebrow="Controle tecnico"
      title="Revisoes"
      description="Acompanhe solicitacoes, prazos e decisoes de revisao vinculadas a projetos, entregaveis e documentos."
      :breadcrumbs="['Dashboard', 'Revisoes']"
    >
      <template #actions>
        <v-btn color="teal" prepend-icon="$plus" @click="isFormOpen = true"> Nova revisao </v-btn>
      </template>
    </BasePageHeader>

    <v-alert v-if="reviewsStore.error" type="error" variant="tonal">
      {{ reviewsStore.error }}
    </v-alert>
    <v-alert v-if="lessonSuccess" type="success" variant="tonal">
      {{ lessonSuccess }}
      <v-btn v-if="createdLessonId" class="ml-2" variant="text" :to="`/knowledge-base/${createdLessonId}`">
        Abrir licao aprendida
      </v-btn>
    </v-alert>

    <v-sheet class="reviews-page__filter-shell" border rounded="lg">
      <div class="reviews-page__filter-bar">
        <v-btn
          size="small"
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros da tabela
        </v-btn>
        <v-chip v-if="activeFiltersCount" color="teal" variant="tonal" size="small">
          {{ activeFiltersCount }} ativo(s)
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="activeFiltersCount"
          variant="text"
          :disabled="reviewsStore.isLoading"
          @click="clearFilters"
        >
          Limpar
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-if="isFiltersOpen" class="reviews-page__filters">
          <v-select
            v-model="selectedProjectId"
            :items="projectOptions"
            label="Projeto"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            @update:model-value="handleFilterProjectChange"
          />
          <v-select
            v-model="selectedDeliverableId"
            :items="deliverableOptions"
            label="Entregavel"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :disabled="!selectedProjectId"
          />
          <v-select
            v-model="selectedDocumentId"
            :items="documentOptions"
            label="Documento"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :disabled="!selectedProjectId"
          />
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
          <div class="reviews-page__filter-actions">
            <v-btn variant="outlined" :disabled="reviewsStore.isLoading" @click="clearFilters">
              Limpar
            </v-btn>
            <v-btn color="teal" :loading="reviewsStore.isLoading" @click="applyFilters">
              Filtrar
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </v-sheet>

    <ReviewsList
      :reviews="reviewsStore.reviews"
      :users="reviewsStore.reviewers"
      :loading="reviewsStore.isLoading"
      :saving="reviewsStore.isSaving"
      :page="reviewsStore.page"
      :page-size="reviewsStore.pageSize"
      :total="reviewsStore.total"
      :can-register-lesson="auth.can('knowledge.register_lesson')"
      @update:page="reviewsStore.loadReviews"
      @open="openReview"
      @approve="openDecision($event, 'approve')"
      @reject="openDecision($event, 'reject')"
      @lesson="openLessonForm"
    />

    <ReviewDetailDialog
      :model-value="isDetailOpen"
      :review="reviewsStore.selectedReview"
      :users="reviewsStore.reviewers"
      :saving="reviewsStore.isSaving"
      @update:model-value="updateDetailOpen"
      @comment="handleComment"
      @approve="openDecision($event, 'approve')"
      @reject="openDecision($event, 'reject')"
    />

    <v-dialog v-model="isFormOpen" max-width="760">
      <ReviewForm
        :projects="reviewsStore.projects"
        :deliverables="reviewsStore.deliverables"
        :documents="reviewsStore.documents"
        :users="reviewsStore.reviewers"
        :saving="reviewsStore.isSaving"
        @project-change="reviewsStore.loadProjectLinks"
        @submit="handleCreate"
      />
    </v-dialog>

    <v-dialog
      :model-value="Boolean(pendingDecision)"
      max-width="520"
      @update:model-value="pendingDecision = null"
    >
      <v-card rounded="lg">
        <v-card-title>
          {{ pendingDecision?.decision === 'approve' ? 'Aprovar revisao' : 'Rejeitar revisao' }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="decisionComment"
            label="Comentario da decisao"
            rows="3"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pendingDecision = null">Cancelar</v-btn>
          <v-btn color="teal" :loading="reviewsStore.isSaving" @click="confirmDecision">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="Boolean(lessonReview)" max-width="760" @update:model-value="lessonReview = null">
      <v-card>
        <v-card-title>Registrar licao aprendida</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-3">
            Esta revisao foi reprovada. Registre o aprendizado para evitar retrabalho.
          </v-alert>
          <v-text-field v-model="lessonForm.title" label="Titulo *" variant="outlined" />
          <v-textarea v-model="lessonForm.context" label="Contexto *" rows="2" variant="outlined" />
          <v-textarea v-model="lessonForm.identifiedProblem" label="Problema identificado *" rows="2" variant="outlined" />
          <v-textarea v-model="lessonForm.impact" label="Impacto" rows="2" variant="outlined" />
          <v-textarea v-model="lessonForm.recommendation" label="Recomendacao *" rows="2" variant="outlined" />
          <v-textarea v-model="lessonForm.riskObservation" label="Quando observar esse risco novamente" rows="2" variant="outlined" />
          <v-text-field v-model="lessonForm.tags" label="Tags (separadas por virgula)" variant="outlined" />
          <v-alert type="info" variant="tonal" class="mt-2">
            A licao sera criada como rascunho na Base de Conhecimento.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="lessonReview = null">Cancelar</v-btn>
          <v-btn
            color="indigo"
            :loading="reviewsStore.isSaving"
            :disabled="!lessonForm.title.trim() || !lessonForm.context.trim() || !lessonForm.identifiedProblem.trim() || !lessonForm.recommendation.trim()"
            @click="submitLesson"
          >
            Registrar licao
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.reviews-page {
  display: grid;
  gap: 1rem;
}

.reviews-page__filter-shell {
  overflow: hidden;
  background: #ffffff;
}

.reviews-page__filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.reviews-page__filters {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  grid-template-columns:
    minmax(12rem, 1fr) minmax(10rem, 14rem) minmax(10rem, 14rem)
    minmax(10rem, 12rem) auto;
  border-top: 1px solid #d8e1de;
  padding: 0.875rem;
}

.reviews-page__filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (max-width: 1120px) {
  .reviews-page__filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .reviews-page__filters {
    grid-template-columns: 1fr;
  }

  .reviews-page__filter-actions {
    justify-content: flex-start;
  }
}
</style>
