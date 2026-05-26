import { httpClient } from '@/shared/http/http-client'
import type { ApiResponse } from '@/shared/types/api-contracts'
import type { AuthToken, LoginCredentials } from '@/modules/auth/types/auth.types'

export type LoginRequest = LoginCredentials
export type LoginResponse = AuthToken

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<ApiResponse<LoginResponse>>('/auth/login', request)
    return response.data.data
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    const response = await httpClient.post<ApiResponse<{ token: string }>>('/auth/refresh', { token })
    return response.data.data
  }
}

export const authService = new AuthService()
