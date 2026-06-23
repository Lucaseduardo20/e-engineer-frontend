import type { TechnicalTagCategory, TechnicalTagStatus } from '@/shared/types/api-contracts'

export const TECHNICAL_TAG_CATEGORY_LABELS: Record<TechnicalTagCategory, string> = {
  project_type: 'Tipo de projeto',
  technical_discipline: 'Disciplina tecnica',
  document_type: 'Tipo de documento',
  operational_pain: 'Dor operacional',
  client_context: 'Contexto de cliente/orgao',
  project_stage: 'Etapa do projeto',
  knowledge_purpose: 'Finalidade do conhecimento',
}

export const TECHNICAL_TAG_STATUS_LABELS: Record<TechnicalTagStatus, string> = {
  active: 'Ativa',
  pending_review: 'Pendente de revisao',
  deprecated: 'Obsoleta',
  archived: 'Arquivada',
}
