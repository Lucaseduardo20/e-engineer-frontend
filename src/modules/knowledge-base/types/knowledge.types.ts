export type KnowledgeItemType =
  | 'technical_standard'
  | 'document_model'
  | 'project_reference'
  | 'lesson_learned'
  | 'review_checklist'
  | 'delivery_standard'
  | 'zoning_rule_reference'
  | 'project_template'

export type KnowledgeItemStatus = 'draft' | 'published' | 'archived' | 'deprecated'

export interface KnowledgeItem {
  id: string
  organizationId: string
  title: string
  description?: string | null
  type: KnowledgeItemType
  status: KnowledgeItemStatus
  tags: string[]
  content?: Record<string, unknown> | null
  createdBy: string
  updatedBy: string
  publishedAt?: number | null
  archivedAt?: number | null
  createdAt: number
  updatedAt: number
}

export interface KnowledgeRelation {
  id: string
  organizationId: string
  knowledgeItemId: string
  targetType: string
  targetId: string
  relationType: string
  createdBy: string
  createdAt: number
}

export interface KnowledgeAttachment {
  id: string
  organizationId: string
  knowledgeItemId: string
  fileId: string
  label: string
  description?: string | null
  createdBy: string
  createdAt: number
}

export interface KnowledgeItemDetail extends KnowledgeItem {
  relations: KnowledgeRelation[]
  attachments: KnowledgeAttachment[]
}

export interface CreateKnowledgeItemDto {
  title: string
  description?: string | null
  type: KnowledgeItemType
  tags?: string[]
  content?: Record<string, unknown> | null
}

export type UpdateKnowledgeItemDto = Partial<CreateKnowledgeItemDto>

export interface LinkKnowledgeItemDto {
  targetType: string
  targetId: string
  relationType: string
}

export interface PromoteProjectToKnowledgeDto {
  title: string
  description?: string | null
  tags?: string[]
  selectedDeliverableIds?: string[]
  lessonsLearned?: string[]
  warnings?: string[]
}

export const knowledgeTypeLabels: Record<KnowledgeItemType, string> = {
  technical_standard: 'Padrao tecnico',
  document_model: 'Documento modelo',
  project_reference: 'Projeto de referencia',
  lesson_learned: 'Licao aprendida',
  review_checklist: 'Checklist de revisao',
  delivery_standard: 'Padrao de entrega',
  zoning_rule_reference: 'Referencia urbanistica',
  project_template: 'Template de projeto',
}

export const knowledgeStatusLabels: Record<KnowledgeItemStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
  deprecated: 'Depreciado',
}
