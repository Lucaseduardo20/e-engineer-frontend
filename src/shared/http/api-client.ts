import { httpClient } from '@/shared/http/http-client'
import { toIsoDate, toIsoString, toTimestamp } from '@/shared/formatters/date.formatter'
import type {
  ApiResponse,
  AuditLogEntry,
  DocumentDetail,
  Deliverable,
  DeliverableType,
  DocumentSummary,
  DocumentStatus,
  DocumentType,
  CreateKnowledgeItemDto,
  KnowledgeAttachment,
  KnowledgeItem,
  KnowledgeItemDetail,
  KnowledgeItemStatus,
  KnowledgeItemType,
  KnowledgeRelation,
  LinkKnowledgeItemDto,
  Organization,
  Paginated,
  PriorityLevel,
  PriorityRequest,
  PriorityTargetType,
  PromoteProjectToKnowledgeDto,
  Project,
  ProjectKnowledgeRecommendation,
  ProjectSimilarRecommendation,
  ProjectTechnicalProfile,
  ReviewComment,
  ReviewDetail,
  ReviewSummary,
  ReviewStatus,
  User,
  UpdateKnowledgeItemDto,
  ProjectKnowledgeItem,
  TechnicalTag,
  TechnicalTagCategory,
  TechnicalTagStatus,
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
  dueDate?: number | null
  status?: Deliverable['status']
  type: DeliverableType
  assignees?: string[]
  tagIds?: string[]
}

export type UpdateDeliverableRequest = Partial<Omit<CreateDeliverableRequest, 'projectId'>>

export interface DeliverableRemovalRequest {
  id: string
  organizationId: string
  projectId: string
  deliverableId: string
  deliverableTitle: string
  requestedBy: string
  reason: string
  status: string
  reviewedBy?: string | null
  reviewedAt?: number | null
  reviewComment?: string | null
  createdAt: number
}

export interface CreateReviewRequest {
  projectId: string
  deliverableId?: string | null
  documentId?: string | null
  documentVersionId?: string | null
  reviewers: string[]
  dueDate?: number | null
  comment?: string | null
}

export interface DecideReviewRequest {
  comment?: string | null
}
export interface RegisterReviewLessonRequest {
  title: string
  context: string
  identifiedProblem: string
  impact?: string
  recommendation: string
  tags?: string[]
  tagIds?: string[]
  riskObservation?: string
}

export interface CreateReviewCommentRequest {
  body: string
}

export interface SwitchTenantRequest {
  organizationId: string
}

export interface ImpersonateUserRequest {
  userId: string
  organizationId: string
}

export interface CreateOrganizationMemberRequest {
  fullName: string
  email: string
  password: string
  role: string
  avatarUrl?: string | null
}

export type UpdateOrganizationMemberRequest = Partial<CreateOrganizationMemberRequest>

export interface CloneOrganizationMemberRequest {
  fullName: string
  email: string
  password: string
}

export interface UpdateOrganizationProfileRequest {
  name?: string
  legalName?: string | null
  logoUrl?: string | null
}

export interface CreatePriorityRequestRequest {
  targetType: PriorityTargetType
  targetId: string
  requestedForUserId?: string | null
  priority: PriorityLevel
  reason?: string | null
}

export interface CreateDocumentRequest {
  projectId: string
  deliverableId?: string | null
  title: string
  description?: string | null
  type: DocumentType
  status?: DocumentStatus
  tagIds?: string[]
}

export interface UpdateDocumentRequest {
  deliverableId?: string | null
  title?: string
  description?: string | null
  type?: DocumentType
  status?: DocumentStatus
  tagIds?: string[]
}
export interface SaveDocumentAsModelRequest {
  title: string
  description?: string | null
  tags?: string[]
  tagIds?: string[]
  whenToUse?: string
  notes?: string
  allowNonOfficial?: boolean
}

export interface UploadDocumentVersionRequest {
  file: File
  revision?: string
  isOfficial?: boolean
  status?: DocumentStatus
  notes?: string | null
}

export interface CreateTechnicalTagRequest {
  name: string
  category: TechnicalTagCategory
  description?: string
}

export interface UpdateTechnicalTagRequest {
  name?: string
  category?: TechnicalTagCategory
  description?: string
  status?: TechnicalTagStatus
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await request
  return response.data.data
}

function toWireDate(value: number | null | undefined) {
  if (value === null) {
    return null
  }

  return toIsoDate(value) ?? undefined
}

function toWireIsoDate(value: number | null | undefined) {
  if (value === null) {
    return null
  }

  return toIsoString(value) ?? undefined
}

function mapPaginated<TInput, TOutput>(
  response: Paginated<TInput>,
  mapper: (item: TInput) => TOutput,
): Paginated<TOutput> {
  return {
    ...response,
    items: response.items.map(mapper),
  }
}

function mapProject(project: Project): Project {
  return {
    ...project,
    startDate: toTimestamp(project.startDate) ?? undefined,
    endDate: toTimestamp(project.endDate) ?? undefined,
  }
}

function mapDeliverable(deliverable: Deliverable): Deliverable {
  return {
    ...deliverable,
    dueDate: toTimestamp(deliverable.dueDate) ?? undefined,
    inheritanceReview: deliverable.inheritanceReview
      ? {
          ...deliverable.inheritanceReview,
          reviewedAt: toTimestamp(deliverable.inheritanceReview.reviewedAt) ?? null,
        }
      : null,
    removalRequest: deliverable.removalRequest
      ? {
          ...deliverable.removalRequest,
          reviewedAt: toTimestamp(deliverable.removalRequest.reviewedAt) ?? null,
        }
      : null,
  }
}

function mapDeliverableRemovalRequest(
  request: DeliverableRemovalRequest,
): DeliverableRemovalRequest {
  return {
    ...request,
    reviewedAt: toTimestamp(request.reviewedAt) ?? null,
    createdAt: toTimestamp(request.createdAt) ?? Date.now(),
  }
}

function mapDocumentVersion(
  version: DocumentSummary['latestVersion'],
): DocumentSummary['latestVersion'] {
  if (!version) {
    return version
  }

  return {
    ...version,
    uploadedAt: toTimestamp(version.uploadedAt) ?? Date.now(),
  }
}

function mapDocumentSummary(document: DocumentSummary): DocumentSummary {
  return {
    ...document,
    updatedAt: toTimestamp(document.updatedAt) ?? Date.now(),
    latestVersion: mapDocumentVersion(document.latestVersion),
    officialVersion: mapDocumentVersion(document.officialVersion),
  }
}

function mapDocumentDetail(document: DocumentDetail): DocumentDetail {
  return {
    ...mapDocumentSummary(document),
    versions: document.versions.map((version) => mapDocumentVersion(version)!),
  }
}

function mapReviewSummary(review: ReviewSummary): ReviewSummary {
  return {
    ...review,
    reviewedAt: toTimestamp(review.reviewedAt) ?? null,
    dueDate: toTimestamp(review.dueDate) ?? null,
    updatedAt: toTimestamp(review.updatedAt) ?? undefined,
  }
}

function mapReviewDetail(review: ReviewDetail): ReviewDetail {
  return {
    ...mapReviewSummary(review),
    createdAt: toTimestamp(review.createdAt) ?? undefined,
    comments: review.comments?.map(mapReviewComment) ?? [],
  }
}

function mapReviewComment(comment: ReviewComment): ReviewComment {
  return {
    ...comment,
    createdAt: toTimestamp(comment.createdAt) ?? Date.now(),
  }
}

function mapAuditLogEntry(entry: AuditLogEntry): AuditLogEntry {
  return {
    ...entry,
    occurredAt: toTimestamp(entry.occurredAt) ?? Date.now(),
  }
}

function mapPriorityRequest(priorityRequest: PriorityRequest): PriorityRequest {
  return {
    ...priorityRequest,
    decidedAt: toTimestamp(priorityRequest.decidedAt) ?? null,
    createdAt: toTimestamp(priorityRequest.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(priorityRequest.updatedAt) ?? Date.now(),
  }
}

function mapKnowledgeItem(item: KnowledgeItem): KnowledgeItem {
  return {
    ...item,
    publishedAt: toTimestamp(item.publishedAt) ?? null,
    archivedAt: toTimestamp(item.archivedAt) ?? null,
    deprecatedAt: toTimestamp(item.deprecatedAt) ?? null,
    createdAt: toTimestamp(item.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(item.updatedAt) ?? Date.now(),
  }
}

function mapKnowledgeRelation(relation: KnowledgeRelation): KnowledgeRelation {
  return {
    ...relation,
    createdAt: toTimestamp(relation.createdAt) ?? Date.now(),
  }
}

function mapKnowledgeAttachment(attachment: KnowledgeAttachment): KnowledgeAttachment {
  return {
    ...attachment,
    createdAt: toTimestamp(attachment.createdAt) ?? Date.now(),
  }
}

function mapProjectKnowledgeItem(item: ProjectKnowledgeItem): ProjectKnowledgeItem {
  return {
    ...item,
    linkedAt: toTimestamp(item.linkedAt) ?? Date.now(),
    knowledgeItem: {
      ...item.knowledgeItem,
      updatedAt: toTimestamp(item.knowledgeItem.updatedAt) ?? Date.now(),
      publishedAt: toTimestamp(item.knowledgeItem.publishedAt) ?? null,
      archivedAt: toTimestamp(item.knowledgeItem.archivedAt) ?? null,
      deprecatedAt: toTimestamp(item.knowledgeItem.deprecatedAt) ?? null,
    },
  }
}

function mapProjectKnowledgeRecommendation(
  recommendation: ProjectKnowledgeRecommendation,
): ProjectKnowledgeRecommendation {
  return {
    ...recommendation,
    knowledgeItem: {
      ...recommendation.knowledgeItem,
      updatedAt: toTimestamp(recommendation.knowledgeItem.updatedAt) ?? Date.now(),
      publishedAt: toTimestamp(recommendation.knowledgeItem.publishedAt) ?? null,
    },
  }
}

function mapKnowledgeItemDetail(item: KnowledgeItemDetail): KnowledgeItemDetail {
  return {
    ...mapKnowledgeItem(item),
    relations: item.relations?.map(mapKnowledgeRelation) ?? [],
    attachments: item.attachments?.map(mapKnowledgeAttachment) ?? [],
  }
}

function mapTechnicalTag(item: TechnicalTag): TechnicalTag {
  return {
    ...item,
    usageCount: item.usageCount ?? 0,
    createdAt: toTimestamp(item.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(item.updatedAt) ?? Date.now(),
    archivedAt: toTimestamp(item.archivedAt) ?? null,
    deprecatedAt: toTimestamp(item.deprecatedAt) ?? null,
  }
}

export const apiClient = {
  auth: {
    login(credentials: LoginCredentials) {
      return unwrap<AuthToken>(httpClient.post('/auth/login', credentials))
    },
    switchTenant(payload: SwitchTenantRequest) {
      return unwrap<AuthToken>(httpClient.post('/auth/switch-tenant', payload))
    },
    impersonate(payload: ImpersonateUserRequest) {
      return unwrap<AuthToken>(httpClient.post('/auth/impersonate', payload))
    },
  },
  organizations: {
    list() {
      return unwrap<Organization[]>(httpClient.get('/organizations'))
    },
    current() {
      return unwrap<Organization>(httpClient.get('/organizations/current'))
    },
    updateCurrent(payload: UpdateOrganizationProfileRequest) {
      return unwrap<Organization>(httpClient.patch('/organizations/current', payload))
    },
    uploadLogo(file: File) {
      const formData = new FormData()
      formData.append('file', file)
      return unwrap<Organization>(httpClient.post('/organizations/current/logo', formData))
    },
    users() {
      return unwrap<User[]>(httpClient.get('/organizations/current/users'))
    },
    createUser(payload: CreateOrganizationMemberRequest) {
      return unwrap<User>(httpClient.post('/organizations/current/users', payload))
    },
    updateUser(userId: string, payload: UpdateOrganizationMemberRequest) {
      return unwrap<User>(httpClient.patch(`/organizations/current/users/${userId}`, payload))
    },
    uploadUserAvatar(userId: string, file: File) {
      const formData = new FormData()
      formData.append('file', file)
      return unwrap<User>(
        httpClient.post(`/organizations/current/users/${userId}/avatar`, formData),
      )
    },
    cloneUser(userId: string, payload: CloneOrganizationMemberRequest) {
      return unwrap<User>(httpClient.post(`/organizations/current/users/${userId}/clone`, payload))
    },
  },
  priorityRequests: {
    async list() {
      const response = await unwrap<PriorityRequest[]>(httpClient.get('/priority-requests'))
      return response.map(mapPriorityRequest)
    },
    create(payload: CreatePriorityRequestRequest) {
      return unwrap<PriorityRequest>(httpClient.post('/priority-requests', payload)).then(
        mapPriorityRequest,
      )
    },
    apply(id: string) {
      return unwrap<PriorityRequest>(httpClient.post(`/priority-requests/${id}/apply`)).then(
        mapPriorityRequest,
      )
    },
    reject(id: string) {
      return unwrap<PriorityRequest>(httpClient.post(`/priority-requests/${id}/reject`)).then(
        mapPriorityRequest,
      )
    },
  },
  projects: {
    async list(params: PageParams = {}) {
      const response = await unwrap<Paginated<Project>>(httpClient.get('/projects', { params }))
      return mapPaginated(response, mapProject)
    },
    async detail(id: string) {
      return mapProject(await unwrap<Project>(httpClient.get(`/projects/${id}`)))
    },
    technicalProfile(id: string) {
      return unwrap<ProjectTechnicalProfile>(httpClient.get(`/projects/${id}/technical-profile`))
    },
    async updateStatus(id: string, status: Project['status']) {
      return mapProject(
        await unwrap<Project>(httpClient.patch(`/projects/${id}/status`, { status })),
      )
    },
    async listKnowledge(projectId: string) {
      const response = await unwrap<{ items: ProjectKnowledgeItem[] }>(
        httpClient.get(`/projects/${projectId}/knowledge`),
      )
      return {
        items: response.items.map(mapProjectKnowledgeItem),
      }
    },
    async recommendKnowledge(projectId: string) {
      const response = await unwrap<{ items: ProjectKnowledgeRecommendation[] }>(
        httpClient.get(`/projects/${projectId}/knowledge/recommendations`),
      )
      return {
        items: response.items.map(mapProjectKnowledgeRecommendation),
      }
    },
    similar(payload: { tagIds: string[]; limit?: number }) {
      return unwrap<{ items: ProjectSimilarRecommendation[] }>(
        httpClient.post('/projects/similar', payload),
      )
    },
    linkKnowledge(
      projectId: string,
      payload: { knowledgeItemId: string; relationType: string; deliverableId?: string },
    ) {
      return unwrap(httpClient.post(`/projects/${projectId}/knowledge`, payload))
    },
    unlinkKnowledge(projectId: string, relationId: string) {
      return unwrap<{ removed: true }>(httpClient.post(`/projects/${projectId}/knowledge/${relationId}/remove`))
    },
  },
  deliverables: {
    async list(params: PageParams & { projectId?: string; status?: Deliverable['status'] } = {}) {
      const response = await unwrap<Paginated<Deliverable>>(
        httpClient.get('/deliverables', { params }),
      )
      return mapPaginated(response, mapDeliverable)
    },
    async get(id: string) {
      return mapDeliverable(await unwrap<Deliverable>(httpClient.get(`/deliverables/${id}`)))
    },
    create(payload: CreateDeliverableRequest) {
      return unwrap<Deliverable>(
        httpClient.post('/deliverables', {
          ...payload,
          dueDate: toWireDate(payload.dueDate),
        }),
      ).then(mapDeliverable)
    },
    update(id: string, payload: UpdateDeliverableRequest) {
      return unwrap<Deliverable>(
        httpClient.patch(`/deliverables/${id}`, {
          ...payload,
          dueDate: toWireDate(payload.dueDate),
        }),
      ).then(mapDeliverable)
    },
    markInheritanceReviewed(id: string) {
      return unwrap<Deliverable>(
        httpClient.post(`/deliverables/${id}/inheritance-review/mark-reviewed`),
      ).then(mapDeliverable)
    },
    requestRemoval(id: string, payload: { reason: string }) {
      return unwrap<DeliverableRemovalRequest>(
        httpClient.post(`/deliverables/${id}/removal-requests`, payload),
      ).then(mapDeliverableRemovalRequest)
    },
    approveRemoval(requestId: string, payload: { comment?: string | null } = {}) {
      return unwrap<DeliverableRemovalRequest>(
        httpClient.post(`/deliverables/removal-requests/${requestId}/approve`, payload),
      ).then(mapDeliverableRemovalRequest)
    },
    rejectRemoval(requestId: string, payload: { comment?: string | null } = {}) {
      return unwrap<DeliverableRemovalRequest>(
        httpClient.post(`/deliverables/removal-requests/${requestId}/reject`, payload),
      ).then(mapDeliverableRemovalRequest)
    },
  },
  documents: {
    async list(
      params: PageParams & {
        projectId?: string
        deliverableId?: string
        status?: DocumentStatus
        type?: DocumentType
      } = {},
    ) {
      const response = await unwrap<Paginated<DocumentSummary>>(
        httpClient.get('/documents', { params }),
      )
      return mapPaginated(response, mapDocumentSummary)
    },
    async get(id: string) {
      return mapDocumentDetail(await unwrap<DocumentDetail>(httpClient.get(`/documents/${id}`)))
    },
    create(payload: CreateDocumentRequest) {
      return unwrap<DocumentDetail>(httpClient.post('/documents', payload)).then(mapDocumentDetail)
    },
    update(id: string, payload: UpdateDocumentRequest) {
      return unwrap<DocumentDetail>(httpClient.patch(`/documents/${id}`, payload)).then(
        mapDocumentDetail,
      )
    },
    delete(id: string) {
      return unwrap<{ deleted: true }>(httpClient.delete(`/documents/${id}`))
    },
    uploadVersion(id: string, payload: UploadDocumentVersionRequest) {
      const formData = new FormData()
      formData.append('file', payload.file)

      if (payload.revision?.trim()) {
        formData.append('revision', payload.revision.trim())
      }

      if (payload.isOfficial !== undefined) {
        formData.append('isOfficial', String(payload.isOfficial))
      }

      if (payload.status) {
        formData.append('status', payload.status)
      }

      if (payload.notes?.trim()) {
        formData.append('notes', payload.notes.trim())
      }

      return unwrap<DocumentDetail>(
        httpClient.post(`/documents/${id}/versions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      ).then(mapDocumentDetail)
    },
    saveAsModel(id: string, payload: SaveDocumentAsModelRequest) {
      return unwrap<{ item: KnowledgeItem; warning?: string }>(
        httpClient.post(`/documents/${id}/save-as-model`, payload),
      ).then((response) => ({ ...response, item: mapKnowledgeItem(response.item) }))
    },
    saveVersionAsModel(documentId: string, versionId: string, payload: SaveDocumentAsModelRequest) {
      return unwrap<{ item: KnowledgeItem; warning?: string }>(
        httpClient.post(`/documents/${documentId}/versions/${versionId}/save-as-model`, payload),
      ).then((response) => ({ ...response, item: mapKnowledgeItem(response.item) }))
    },
  },
  reviews: {
    async list(
      params: PageParams & {
        projectId?: string
        deliverableId?: string
        documentId?: string
        status?: ReviewStatus
      } = {},
    ) {
      const response = await unwrap<Paginated<ReviewSummary>>(
        httpClient.get('/reviews', { params }),
      )
      return mapPaginated(response, mapReviewSummary)
    },
    async get(id: string) {
      return mapReviewDetail(await unwrap<ReviewDetail>(httpClient.get(`/reviews/${id}`)))
    },
    create(payload: CreateReviewRequest) {
      return unwrap<ReviewDetail>(
        httpClient.post('/reviews', {
          ...payload,
          dueDate: toWireIsoDate(payload.dueDate),
        }),
      ).then(mapReviewDetail)
    },
    approve(id: string, payload: DecideReviewRequest = {}) {
      return unwrap<ReviewDetail>(httpClient.post(`/reviews/${id}/approve`, payload)).then(
        mapReviewDetail,
      )
    },
    reject(id: string, payload: DecideReviewRequest = {}) {
      return unwrap<ReviewDetail>(httpClient.post(`/reviews/${id}/reject`, payload)).then(
        mapReviewDetail,
      )
    },
    comment(id: string, payload: CreateReviewCommentRequest) {
      return unwrap<ReviewComment>(httpClient.post(`/reviews/${id}/comments`, payload)).then(
        mapReviewComment,
      )
    },
    registerLessonLearned(id: string, payload: RegisterReviewLessonRequest) {
      return unwrap<KnowledgeItem>(httpClient.post(`/reviews/${id}/register-lesson-learned`, payload)).then(
        mapKnowledgeItem,
      )
    },
  },
  knowledgeBase: {
    async list(
      params: PageParams & {
        type?: KnowledgeItemType
        status?: KnowledgeItemStatus
        tags?: string[]
      } = {},
    ) {
      const response = await unwrap<Paginated<KnowledgeItem>>(
        httpClient.get('/knowledge-base', { params }),
      )
      return mapPaginated(response, mapKnowledgeItem)
    },
    async search(
      params: PageParams & {
        q?: string
        type?: KnowledgeItemType
        status?: KnowledgeItemStatus
        tags?: string[]
      } = {},
    ) {
      const response = await unwrap<Paginated<KnowledgeItem>>(
        httpClient.get('/knowledge-base/search', { params }),
      )
      return mapPaginated(response, mapKnowledgeItem)
    },
    get(id: string) {
      return unwrap<KnowledgeItemDetail>(httpClient.get(`/knowledge-base/${id}`)).then(
        mapKnowledgeItemDetail,
      )
    },
    create(payload: CreateKnowledgeItemDto) {
      return unwrap<KnowledgeItem>(httpClient.post('/knowledge-base', payload)).then(
        mapKnowledgeItem,
      )
    },
    update(id: string, payload: UpdateKnowledgeItemDto) {
      return unwrap<KnowledgeItem>(httpClient.patch(`/knowledge-base/${id}`, payload)).then(
        mapKnowledgeItem,
      )
    },
    publish(id: string) {
      return unwrap<KnowledgeItem>(httpClient.post(`/knowledge-base/${id}/publish`)).then(
        mapKnowledgeItem,
      )
    },
    archive(id: string) {
      return unwrap<KnowledgeItem>(httpClient.post(`/knowledge-base/${id}/archive`)).then(
        mapKnowledgeItem,
      )
    },
    deprecate(id: string) {
      return unwrap<KnowledgeItem>(httpClient.post(`/knowledge-base/${id}/deprecate`)).then(
        mapKnowledgeItem,
      )
    },
    link(id: string, payload: LinkKnowledgeItemDto) {
      return unwrap<KnowledgeRelation>(
        httpClient.post(`/knowledge-base/${id}/relations`, payload),
      ).then(mapKnowledgeRelation)
    },
    promoteProject(projectId: string, payload: PromoteProjectToKnowledgeDto) {
      return unwrap<KnowledgeItem>(
        httpClient.post(`/projects/${projectId}/promote-to-knowledge`, payload),
      ).then(mapKnowledgeItem)
    },
  },
  technicalTags: {
    async list(
      params: PageParams & {
        search?: string
        category?: TechnicalTagCategory
        status?: TechnicalTagStatus
        includeArchived?: boolean
        limit?: number
      } = {},
    ) {
      const response = await unwrap<Paginated<TechnicalTag>>(httpClient.get('/technical-tags', { params }))
      return mapPaginated(response, mapTechnicalTag)
    },
    get(id: string) {
      return unwrap<TechnicalTag>(httpClient.get(`/technical-tags/${id}`)).then(mapTechnicalTag)
    },
    create(payload: CreateTechnicalTagRequest) {
      return unwrap<TechnicalTag>(httpClient.post('/technical-tags', payload)).then(mapTechnicalTag)
    },
    update(id: string, payload: UpdateTechnicalTagRequest) {
      return unwrap<TechnicalTag>(httpClient.patch(`/technical-tags/${id}`, payload)).then(mapTechnicalTag)
    },
    archive(id: string) {
      return unwrap<TechnicalTag>(httpClient.post(`/technical-tags/${id}/archive`)).then(mapTechnicalTag)
    },
    deprecate(id: string) {
      return unwrap<TechnicalTag>(httpClient.post(`/technical-tags/${id}/deprecate`)).then(mapTechnicalTag)
    },
  },
  audit: {
    async list(params: PageParams & { entityType?: string; entityId?: string } = {}) {
      const response = await unwrap<Paginated<AuditLogEntry>>(httpClient.get('/audit', { params }))
      return mapPaginated(response, mapAuditLogEntry)
    },
  },
}
