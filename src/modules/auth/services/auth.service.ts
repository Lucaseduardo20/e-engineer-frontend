import { httpClient } from '@/shared/http/http-client'
import type { AuthToken, LoginCredentials } from '@/modules/auth/types/auth.types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const response = await httpClient.post<AuthToken>('/auth/login', credentials)

    return response.data
  },
}

