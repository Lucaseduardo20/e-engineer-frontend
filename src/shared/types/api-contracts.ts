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
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  organizationId: string
  startDate?: number
  endDate?: number
  progress: number
  metrics?: Record<string, number>
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
  actorName: string
  action: string
  entityType: string
  entityId?: string | null
  description: string
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
