export type StatusBadgeKind =
  | 'project:draft'
  | 'project:active'
  | 'project:paused'
  | 'project:completed'
  | 'project:archived'
  | 'deliverable:todo'
  | 'deliverable:in_progress'
  | 'deliverable:done'
  | 'deliverable:blocked'
  | 'review:pending'
  | 'review:approved'
  | 'review:rejected'
  | 'review:overdue'
  | 'review:in_review'
  | 'document:draft'
  | 'document:approved'
  | 'document:in_review'
  | 'document:superseded'
  | 'audit:default'

export type StatusBadgeConfig = {
  label: string
  color: string
  icon: string
  tone: 'quiet' | 'solid'
}

export const statusBadgeConfig: Record<StatusBadgeKind, StatusBadgeConfig> = {
  'project:draft': {
    label: 'Rascunho',
    color: 'blue-grey',
    icon: '$edit',
    tone: 'quiet',
  },
  'project:active': {
    label: 'Ativo',
    color: 'teal',
    icon: '$success',
    tone: 'solid',
  },
  'project:paused': {
    label: 'Pausado',
    color: 'amber',
    icon: '$pause',
    tone: 'quiet',
  },
  'project:completed': {
    label: 'Concluido',
    color: 'green',
    icon: '$complete',
    tone: 'solid',
  },
  'project:archived': {
    label: 'Arquivado',
    color: 'grey',
    icon: '$file',
    tone: 'quiet',
  },
  'deliverable:todo': {
    label: 'A produzir',
    color: 'blue-grey',
    icon: '$plus',
    tone: 'quiet',
  },
  'deliverable:in_progress': {
    label: 'Em producao',
    color: 'blue',
    icon: '$loading',
    tone: 'quiet',
  },
  'deliverable:done': {
    label: 'Concluido',
    color: 'green',
    icon: '$complete',
    tone: 'solid',
  },
  'deliverable:blocked': {
    label: 'Bloqueado',
    color: 'red',
    icon: '$warning',
    tone: 'quiet',
  },
  'review:pending': {
    label: 'Pendente',
    color: 'amber',
    icon: '$calendar',
    tone: 'quiet',
  },
  'review:approved': {
    label: 'Aprovada',
    color: 'green',
    icon: '$success',
    tone: 'solid',
  },
  'review:rejected': {
    label: 'Reprovada',
    color: 'red',
    icon: '$error',
    tone: 'quiet',
  },
  'review:overdue': {
    label: 'Atrasada',
    color: 'red',
    icon: '$warning',
    tone: 'solid',
  },
  'review:in_review': {
    label: 'Em revisao',
    color: 'blue',
    icon: '$search',
    tone: 'quiet',
  },
  'document:draft': {
    label: 'Minuta',
    color: 'blue-grey',
    icon: '$file',
    tone: 'quiet',
  },
  'document:approved': {
    label: 'Oficial',
    color: 'green',
    icon: '$complete',
    tone: 'solid',
  },
  'document:in_review': {
    label: 'Em revisao',
    color: 'blue',
    icon: '$search',
    tone: 'quiet',
  },
  'document:superseded': {
    label: 'Substituido',
    color: 'grey',
    icon: '$file',
    tone: 'quiet',
  },
  'audit:default': {
    label: 'Evento',
    color: 'indigo',
    icon: '$info',
    tone: 'quiet',
  },
}

export function getStatusBadge(kind: StatusBadgeKind): StatusBadgeConfig {
  return statusBadgeConfig[kind]
}

export function projectBadgeKind(status: string): StatusBadgeKind {
  return `project:${status}` as StatusBadgeKind
}

export function deliverableBadgeKind(status: string): StatusBadgeKind {
  return `deliverable:${status}` as StatusBadgeKind
}

export function reviewBadgeKind(status: string): StatusBadgeKind {
  const normalized = status === 'pending' ? 'pending' : status
  return `review:${normalized}` as StatusBadgeKind
}

export function documentBadgeKind(status: string): StatusBadgeKind {
  return `document:${status || 'draft'}` as StatusBadgeKind
}
