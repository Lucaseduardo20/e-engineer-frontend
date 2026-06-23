import type {
  ActivityLogItem,
  DashboardMetric,
  PendingReview,
  RecentProject,
} from '@/modules/dashboard/types/dashboard.types'

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Projetos ativos',
    value: '18',
    supportingText: '4 com marco tecnico nesta semana',
    tone: 'info',
  },
  {
    label: 'Entregaveis pendentes',
    value: '42',
    supportingText: '11 aguardam documento oficial',
    tone: 'warning',
  },
  {
    label: 'Revisoes aguardando',
    value: '9',
    supportingText: '3 vencem em ate 48 horas',
    tone: 'danger',
  },
  {
    label: 'Documentos oficiais',
    value: '126',
    supportingText: '87% com versao oficial definida',
    tone: 'success',
  },
]

export const recentProjects: RecentProject[] = [
  {
    id: 'project-001',
    name: 'Reforma da Escola Municipal Jardim Primavera',
    client: 'Prefeitura de Santa Aurora',
    type: 'Reforma predial',
    statusLabel: 'Em desenvolvimento',
    statusTone: 'info',
    responsibleEngineer: 'Marina Azevedo',
    dueDate: 1781222400000,
    progress: 68,
  },
  {
    id: 'project-002',
    name: 'Sistema de Drenagem do Bairro Sao Lucas',
    client: 'Secretaria de Obras',
    type: 'Infraestrutura urbana',
    statusLabel: 'Revisao tecnica',
    statusTone: 'warning',
    responsibleEngineer: 'Rafael Nogueira',
    dueDate: 1780444800000,
    progress: 81,
  },
  {
    id: 'project-003',
    name: 'Construção de UBS Vila Esperança',
    client: 'Consorcio Saude Norte',
    type: 'Edificacao publica',
    statusLabel: 'Aprovado',
    statusTone: 'success',
    responsibleEngineer: 'Bianca Martins',
    dueDate: 1782864000000,
    progress: 94,
  },
]

export const pendingReviews: PendingReview[] = [
  {
    id: 'review-001',
    documentName: 'Memorial descritivo - revisao R02',
    projectName: 'Sistema de Drenagem do Bairro Sao Lucas',
    reviewerName: 'Carolina Prado',
    dueDate: 1779840000000,
    statusLabel: 'Aguardando aprovacao',
    statusTone: 'warning',
  },
  {
    id: 'review-002',
    documentName: 'Projeto estrutural - versao V03',
    projectName: 'Construção de UBS Vila Esperança',
    reviewerName: 'Henrique Lima',
    dueDate: 1779667200000,
    statusLabel: 'Vence hoje',
    statusTone: 'danger',
  },
  {
    id: 'review-003',
    documentName: 'Cronograma fisico-financeiro',
    projectName: 'Reforma da Escola Municipal Jardim Primavera',
    reviewerName: 'Marina Azevedo',
    dueDate: 1780012800000,
    statusLabel: 'Em analise',
    statusTone: 'info',
  },
]

export const activityLog: ActivityLogItem[] = [
  {
    id: 'activity-001',
    title: 'Versao oficial definida',
    description: 'Projeto arquitetonico R03 marcado como oficial na UBS Vila Esperança.',
    occurredAt: 1779727200000,
    tone: 'success',
  },
  {
    id: 'activity-002',
    title: 'Pendencia tecnica registrada',
    description: 'Revisor solicitou ajuste no memorial descritivo da drenagem do Bairro Sao Lucas.',
    occurredAt: 1779714900000,
    tone: 'warning',
  },
  {
    id: 'activity-003',
    title: 'Projeto usado como referencia',
    description: 'Equipe vinculou a revitalizacao da Praca Central como base de comparacao.',
    occurredAt: 1779650400000,
    tone: 'info',
  },
]
