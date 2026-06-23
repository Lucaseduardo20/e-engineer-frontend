export interface User {
  id: string
  fullName: string
  email: string
  avatarUrl?: string | null
  roles: string[]
  isPlatformAdmin?: boolean
  impersonatedBy?: string | null
  organizationId?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  parentId?: string | null
}

export interface Project {
  id: string
  name: string
  description?: string
  client?: string | null
  projectType?: string | null
  responsibleName?: string | null
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  organizationId: string
  startDate?: number
  endDate?: number
  progress: number
  tagIds?: string[]
  tags?: Array<{
    id: string
    name: string
    slug: string
    category: string
    status: string
  }>
  legacyTags?: string[]
  metrics?: Record<string, number>
}

export interface ProjectTechnicalProfileSource {
  type: 'project_tag' | 'deliverable_tag' | 'document_tag' | 'official_document'
  score: number
}

export interface ProjectTechnicalProfileTag {
  id: string
  name: string
  slug: string
  category: string
  status: string
  score: number
  sources: ProjectTechnicalProfileSource[]
}

export interface ProjectTechnicalProfile {
  projectId: string
  organizationId: string
  scoreExplanation: string
  tags: ProjectTechnicalProfileTag[]
}

export interface Deliverable {
  id: string
  projectId: string
  title: string
  description?: string
  dueDate?: number
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  type?:
    | 'technical_survey'
    | 'architectural_project'
    | 'structural_project'
    | 'electrical_project'
    | 'hydraulic_project'
    | 'drainage_project'
    | 'paving_project'
    | 'landscaping_project'
    | 'lighting_project'
    | 'descriptive_memorial'
    | 'budget'
    | 'schedule'
    | 'art_rrt'
    | 'photographic_report'
    | 'technical_report'
    | 'other'
  assignees: string[]
  tagIds?: string[]
  tags?: Array<{
    id: string
    name: string
    slug: string
    category: string
    status: string
  }>
  inheritanceReview?: {
    relationId: string
    baseProjectId: string
    baseDeliverableId: string
    needsReviewAfterInheritance: boolean
    reviewedBy?: string | null
    reviewedAt?: number | null
  } | null
  removalRequest?: {
    id: string
    status: string
    reason: string
    requestedBy: string
    reviewedBy?: string | null
    reviewedAt?: number | null
    reviewComment?: string | null
  } | null
  attachments?: { url: string; name: string }[]
}

export type DeliverableType =
  | 'technical_survey'
  | 'architectural_project'
  | 'structural_project'
  | 'electrical_project'
  | 'hydraulic_project'
  | 'drainage_project'
  | 'paving_project'
  | 'landscaping_project'
  | 'lighting_project'
  | 'descriptive_memorial'
  | 'budget'
  | 'schedule'
  | 'art_rrt'
  | 'photographic_report'
  | 'technical_report'
  | 'other'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DocumentSummary {
  id: string
  projectId: string
  deliverableId?: string | null
  title: string
  description?: string | null
  type: DocumentType
  officialRevision?: string | null
  status: DocumentStatus
  updatedAt: number
  tagIds?: string[]
  tags?: TechnicalTag[]
  latestVersion?: DocumentVersion | null
  officialVersion?: DocumentVersion | null
}

export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'superseded'

export type DocumentType =
  | 'memorial_descritivo'
  | 'projeto_estrutural'
  | 'projeto_arquitetonico'
  | 'projeto_eletrico'
  | 'projeto_hidrossanitario'
  | 'orcamento'
  | 'cronograma'
  | 'laudo'
  | 'relatorio_fotografico'
  | 'art_rrt'
  | 'levantamento_topografico'
  | 'especificacao_tecnica'
  | 'outro'

export interface DocumentVersion {
  id: string
  documentId: string
  revision: string
  fileName: string
  filePath: string
  uploadedBy: string
  uploadedAt: number
  isOfficial: boolean
  status: DocumentStatus
  notes?: string | null
}

export interface DocumentDetail extends DocumentSummary {
  versions: DocumentVersion[]
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'overdue'

export interface ReviewReviewer {
  userId: string
  role: string
}

export interface ReviewSummary {
  id: string
  projectId: string
  deliverableId?: string | null
  documentId?: string | null
  documentVersionId?: string | null
  status: ReviewStatus
  requestedBy: string
  reviewers: ReviewReviewer[]
  reviewedBy?: string | null
  reviewedAt?: number | null
  dueDate?: number | null
  comment?: string | null
  decisionComment?: string | null
  updatedAt?: number
}

export interface ReviewComment {
  id: string
  reviewId: string
  authorUserId: string
  body: string
  createdAt: number
}

export interface ReviewDetail extends ReviewSummary {
  createdAt?: number
  comments?: ReviewComment[]
}

export type PriorityTargetType = 'project' | 'deliverable' | 'review' | 'document'
export type PriorityLevel = 'normal' | 'high' | 'urgent'
export type PriorityRequestStatus = 'requested' | 'applied' | 'rejected'

export interface PriorityRequest {
  id: string
  organizationId: string
  targetType: PriorityTargetType
  targetId: string
  requestedBy: string
  requestedForUserId?: string | null
  priority: PriorityLevel
  reason?: string | null
  status: PriorityRequestStatus
  decidedBy?: string | null
  decidedAt?: number | null
  createdAt: number
  updatedAt: number
}

export interface AuditLogEntry {
  id: string
  actorId?: string | null
  actorDisplayName?: string | null
  actorName: string
  action: string
  entityType: string
  entityId?: string | null
  description: string
  metadata?: Record<string, unknown>
  occurredAt: number
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export type {
  CreateKnowledgeItemDto,
  KnowledgeAttachment,
  KnowledgeItem,
  KnowledgeItemDetail,
  KnowledgeItemStatus,
  KnowledgeItemType,
  KnowledgeRelation,
  LinkKnowledgeItemDto,
  PromoteProjectToKnowledgeDto,
  UpdateKnowledgeItemDto,
} from '@/modules/knowledge-base/types/knowledge.types'


export interface ProjectKnowledgeItem {
  relationId: string
  relationType: string
  targetType: 'project' | 'deliverable' | string
  targetId: string
  linkedAt: number
  linkedBy: string
  knowledgeItem: {
    id: string
    title: string
    description?: string | null
    type: string
    status: string
    tags: string[]
    updatedAt: number
    publishedAt?: number | null
    archivedAt?: number | null
    deprecatedAt?: number | null
  }
}

export interface KnowledgeRecommendationTag {
  id: string
  name: string
  slug: string
  category: string
  status: string
}

export interface ProjectKnowledgeRecommendation {
  type: 'knowledge_item' | 'document_model' | 'review_checklist' | 'project_reference'
  knowledgeItem: {
    id: string
    title: string
    description?: string | null
    type: string
    status: string
    tags: KnowledgeRecommendationTag[]
    updatedAt: number
    publishedAt?: number | null
  }
  matchedTags: KnowledgeRecommendationTag[]
  score: number
  reason: string
  alreadyApplied: boolean
}

export interface ProjectBaseRecommendation {
  project: {
    id: string
    name: string
    client?: string | null
    projectType?: string | null
    status: string
    progress: number
  }
  matchedTags: KnowledgeRecommendationTag[]
  deliverablesPreview: Array<{
    id: string
    title: string
    type: string
    status: string
    tags: KnowledgeRecommendationTag[]
  }>
  documentsPreview: Array<{
    id: string
    title: string
    type: string
    status: string
    versionsCount: number
  }>
  reviewsCount: number
  score: number
}

export interface ProjectSimilarRecommendation {
  project: {
    id: string
    name: string
    client?: string | null
    projectType?: string | null
    status: string
    progress: number
  }
  matchedTags: KnowledgeRecommendationTag[]
  reason: string
  counters: {
    matchedTags: number
    deliverables: number
    documents: number
    reviews: number
  }
  score: number
}

export type TechnicalTagCategory =
  | 'project_type'
  | 'technical_discipline'
  | 'document_type'
  | 'operational_pain'
  | 'client_context'
  | 'project_stage'
  | 'knowledge_purpose'

export type TechnicalTagStatus = 'active' | 'pending_review' | 'deprecated' | 'archived'

export interface TechnicalTag {
  id: string
  organizationId: string
  name: string
  slug: string
  category: TechnicalTagCategory
  description?: string | null
  status: TechnicalTagStatus
  usageCount: number
  createdBy: string
  updatedBy?: string | null
  createdAt: number
  updatedAt: number
  archivedAt?: number | null
  deprecatedAt?: number | null
}
