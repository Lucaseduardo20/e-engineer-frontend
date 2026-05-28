<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ReviewForm from '@/modules/reviews/components/ReviewForm.vue'
import ReviewsList from '@/modules/reviews/components/ReviewsList.vue'
import { useReviewsStore } from '@/modules/reviews/stores/reviews.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { ReviewStatus, ReviewSummary } from '@/shared/types/api-contracts'

const reviewsStore = useReviewsStore()
const isFormOpen = ref(false)
const isFiltersOpen = ref(false)
const pendingDecision = ref<{ review: ReviewSummary; decision: 'approve' | 'reject' } | null>(null)
const decisionComment = ref('')
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

onMounted(() => {
  reviewsStore.resetFilters()
  void Promise.all([reviewsStore.loadLookups(), reviewsStore.loadReviews(1, {})])
})

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

    <v-sheet class="reviews-page__filter-shell" border rounded="lg">
      <div class="reviews-page__filter-bar">
        <v-btn
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros
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
      @update:page="reviewsStore.loadReviews"
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
