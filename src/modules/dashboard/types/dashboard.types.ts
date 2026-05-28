import type { StatusTone } from '@/shared/types/status-tone.types'

export type DashboardMetric = {
  label: string
  value: string
  supportingText: string
  tone: StatusTone
}

export type RecentProject = {
  id: string
  name: string
  client: string
  type: string
  statusLabel: string
  statusTone: StatusTone
  responsibleEngineer: string
  dueDate: number
  progress: number
}

export type PendingReview = {
  id: string
  documentName: string
  projectName: string
  reviewerName: string
  dueDate: number
  statusLabel: string
  statusTone: StatusTone
}

export type ActivityLogItem = {
  id: string
  title: string
  description: string
  occurredAt: number
  tone: StatusTone
}
