import type { User } from '@/shared/types/api-contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function displayUserName(
  userId?: string | null,
  users: User[] = [],
  fallback = 'Usuário não identificado',
) {
  if (!userId) {
    return fallback
  }

  return users.find((user) => user.id === userId)?.fullName ?? fallback
}

export function displayActorName(
  input: {
    actorId?: string | null
    actorDisplayName?: string | null
    actorName?: string | null
  },
  users: User[] = [],
) {
  if (input.actorId) {
    const user = users.find((item) => item.id === input.actorId)
    if (user?.fullName) return user.fullName
  }

  if (input.actorDisplayName && !UUID_PATTERN.test(input.actorDisplayName)) {
    return input.actorDisplayName
  }

  if (input.actorName && !UUID_PATTERN.test(input.actorName)) {
    return input.actorName
  }

  return 'Usuário não identificado'
}
