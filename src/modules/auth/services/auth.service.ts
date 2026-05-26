import { apiClient } from '@/shared/http/api-client'
import type { AuthToken, LoginCredentials } from '@/modules/auth/types/auth.types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    return apiClient.auth.login(credentials)
  },
}
