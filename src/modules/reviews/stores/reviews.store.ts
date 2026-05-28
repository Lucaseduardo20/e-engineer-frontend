import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  apiClient,
  type CreateReviewRequest,
  type DecideReviewRequest,
} from '@/shared/http/api-client'
import type {
  Deliverable,
  DocumentSummary,
  Project,
  ReviewDetail,
  ReviewStatus,
  ReviewSummary,
  User,
} from '@/shared/types/api-contracts'
import { getApiErrorMessage } from '@/shared/http/api-error'

export type ReviewListFilters = {
  projectId?: string
  deliverableId?: string
  documentId?: string
  status?: ReviewStatus
}

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref<ReviewSummary[]>([])
  const selectedReview = ref<ReviewDetail | null>(null)
  const projects = ref<Project[]>([])
  const deliverables = ref<Deliverable[]>([])
  const documents = ref<DocumentSummary[]>([])
  const reviewers = ref<User[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const filters = ref<ReviewListFilters>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const pendingReviews = computed(() =>
    reviews.value.filter((review) => review.status === 'pending' || review.status === 'overdue'),
  )

  async function loadReviews(nextPage = page.value, nextFilters = filters.value) {
    isLoading.value = true
    error.value = null
    page.value = nextPage
    filters.value = removeEmptyFilters(nextFilters)

    try {
      const response = await apiClient.reviews.list({
        page: page.value,
        pageSize: pageSize.value,
        ...filters.value,
      })
      reviews.value = response.items
      total.value = response.total
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar as revisoes.')
    } finally {
      isLoading.value = false
    }
  }

  function resetFilters() {
    filters.value = {}
    page.value = 1
    deliverables.value = []
    documents.value = []
  }

  async function loadLookups() {
    try {
      const [projectPage, users] = await Promise.all([
        apiClient.projects.list({ page: 1, pageSize: 100 }),
        apiClient.organizations.users(),
      ])
      projects.value = projectPage.items
      reviewers.value = users
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os filtros.')
    }
  }

  async function loadProjectLinks(projectId: string) {
    deliverables.value = []
    documents.value = []

    if (!projectId) {
      return
    }

    try {
      const [deliverablePage, documentPage] = await Promise.all([
        apiClient.deliverables.list({ projectId, page: 1, pageSize: 100 }),
        apiClient.documents.list({ projectId, page: 1, pageSize: 100 }),
      ])
      deliverables.value = deliverablePage.items
      documents.value = documentPage.items
    } catch {
      deliverables.value = []
      documents.value = []
    }
  }

  async function createReview(payload: CreateReviewRequest) {
    isSaving.value = true
    error.value = null

    try {
      const created = await apiClient.reviews.create(payload)
      selectedReview.value = created
      await loadReviews(1)
      return created
    } catch (createError) {
      error.value = getApiErrorMessage(createError, 'Nao foi possivel solicitar a revisao.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function approveReview(reviewId: string, payload: DecideReviewRequest = {}) {
    return decideReview(reviewId, 'approve', payload)
  }

  async function rejectReview(reviewId: string, payload: DecideReviewRequest = {}) {
    return decideReview(reviewId, 'reject', payload)
  }

  async function decideReview(
    reviewId: string,
    decision: 'approve' | 'reject',
    payload: DecideReviewRequest,
  ) {
    isSaving.value = true
    error.value = null

    try {
      const updated =
        decision === 'approve'
          ? await apiClient.reviews.approve(reviewId, payload)
          : await apiClient.reviews.reject(reviewId, payload)
      selectedReview.value = updated
      await loadReviews(page.value)
      return updated
    } catch (decisionError) {
      error.value = getApiErrorMessage(decisionError, 'Nao foi possivel concluir a revisao.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  return {
    reviews,
    selectedReview,
    projects,
    deliverables,
    documents,
    reviewers,
    total,
    page,
    pageSize,
    filters,
    isLoading,
    isSaving,
    error,
    pendingReviews,
    loadReviews,
    resetFilters,
    loadLookups,
    loadProjectLinks,
    createReview,
    approveReview,
    rejectReview,
  }
})

function removeEmptyFilters(filters: ReviewListFilters): ReviewListFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value)),
  ) as ReviewListFilters
}
