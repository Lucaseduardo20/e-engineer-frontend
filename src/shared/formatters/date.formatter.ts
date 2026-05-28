export type TimestampInput = number | string | Date | null | undefined

export function toTimestamp(value: TimestampInput): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? time : null
  }

  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function dateInputToTimestamp(value: string): number | null {
  if (!value) {
    return null
  }

  const time = new Date(`${value}T00:00:00`).getTime()
  return Number.isFinite(time) ? time : null
}

export function toDateInputValue(value: TimestampInput): string {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toIsoString(value: TimestampInput): string | null {
  const timestamp = toTimestamp(value)
  return timestamp ? new Date(timestamp).toISOString() : null
}

export function toIsoDate(value: TimestampInput): string | null {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return null
  }

  return toDateInputValue(timestamp)
}

export function formatShortDate(value: TimestampInput): string {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function formatDateTime(value: TimestampInput): string {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatRelativeDueDate(value: TimestampInput): string {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return 'sem prazo'
  }

  const target = new Date(timestamp)
  const today = new Date()
  const targetDay = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const diffInDays = Math.round((targetDay - todayDay) / 86_400_000)

  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} dia(s) em atraso`
  }

  if (diffInDays === 0) {
    return 'vence hoje'
  }

  return `vence em ${diffInDays} dia(s)`
}
