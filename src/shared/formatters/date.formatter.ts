export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeDueDate(value: string): string {
  const target = new Date(value)
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
