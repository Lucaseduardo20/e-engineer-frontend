import { httpClient } from '@/shared/http/http-client'
import type {
  ApiResponse,
  AuditLogEntry,
  Deliverable,
  DeliverableType,
  DocumentSummary,
  Organization,
  Paginated,
  Project,
  ReviewDetail,
  ReviewSummary,
  ReviewStatus,
  User,
} from '@/shared/types/api-contracts'
import type { AuthToken, LoginCredentials } from '@/modules/auth/types/auth.types'

type PageParams = {
  page?: number
  pageSize?: number
}

export type CreateDeliverableRequest = {
  projectId: string
  title: string
  description?: string | null
  dueDate?: string | null
  status?: Deliverable['status']
  type: DeliverableType
  assignees?: string[]
}

export type UpdateDeliverableRequest = Partial<Omit<CreateDeliverableRequest, 'projectId'>>

export interface CreateReviewRequest {
  projectId: string
  deliverableId?: string | null
  documentId?: string | null
  documentVersionId?: string | null
  reviewers: string[]
  dueDate?: string | null
  comment?: string | null
}

export interface DecideReviewRequest {
  comment?: string | null
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await request
  return response.data.data
}

export const apiClient = {
  auth: {
    login(credentials: LoginCredentials) {
      return unwrap<AuthToken>(httpClient.post('/auth/login', credentials))
    },
  },
  organizations: {
    current() {
      return unwrap<Organization>(httpClient.get('/organizations/current'))
    },
    users() {
      return unwrap<User[]>(httpClient.get('/organizations/current/users'))
    },
  },
  projects: {
    list(params: PageParams = {}) {
      return unwrap<Paginated<Project>>(httpClient.get('/projects', { params }))
    },
    detail(id: string) {
      return unwrap<Project>(httpClient.get(`/projects/${id}`))
    },
  },
  deliverables: {
    list(params: PageParams & { projectId?: string; status?: Deliverable['status'] } = {}) {
      return unwrap<Paginated<Deliverable>>(httpClient.get('/deliverables', { params }))
    },
    get(id: string) {
      return unwrap<Deliverable>(httpClient.get(`/deliverables/${id}`))
    },
    create(payload: CreateDeliverableRequest) {
      return unwrap<Deliverable>(httpClient.post('/deliverables', payload))
    },
    update(id: string, payload: UpdateDeliverableRequest) {
      return unwrap<Deliverable>(httpClient.patch(`/deliverables/${id}`, payload))
    },
  },
  documents: {
    list(params: PageParams & { projectId?: string; deliverableId?: string } = {}) {
      return unwrap<Paginated<DocumentSummary>>(httpClient.get('/documents', { params }))
    },
  },
  reviews: {
    list(
      params: PageParams & {
        projectId?: string
        deliverableId?: string
        documentId?: string
        status?: ReviewStatus
      } = {},
    ) {
      return unwrap<Paginated<ReviewSummary>>(httpClient.get('/reviews', { params }))
    },
    get(id: string) {
      return unwrap<ReviewDetail>(httpClient.get(`/reviews/${id}`))
    },
    create(payload: CreateReviewRequest) {
      return unwrap<ReviewDetail>(httpClient.post('/reviews', payload))
    },
    approve(id: string, payload: DecideReviewRequest = {}) {
      return unwrap<ReviewDetail>(httpClient.post(`/reviews/${id}/approve`, payload))
    },
    reject(id: string, payload: DecideReviewRequest = {}) {
      return unwrap<ReviewDetail>(httpClient.post(`/reviews/${id}/reject`, payload))
    },
  },
  knowledgeBase: {
    search(params: PageParams & { q?: string } = {}) {
      return unwrap<Paginated<Project>>(httpClient.get('/knowledge-base/search', { params }))
    },
  },
  audit: {
    list(params: PageParams = {}) {
      return unwrap<Paginated<AuditLogEntry>>(httpClient.get('/audit', { params }))
    },
  },
}
