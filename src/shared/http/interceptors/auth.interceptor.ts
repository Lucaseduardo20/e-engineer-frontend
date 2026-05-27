import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_STORAGE_KEY } from '@/modules/auth/constants/auth-storage.constants'
import type { ApiResponse } from '@/shared/types/api-contracts'

type AuthInterceptorOptions = {
  getToken?: () => string | null
  onTokenRefreshed?: (token: string) => void
  onUnauthorized?: () => void
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retryAuthRefresh?: boolean
}

function isAuthEndpoint(url?: string): boolean {
  return Boolean(url?.includes('/auth/login') || url?.includes('/auth/refresh'))
}

export function registerAuthInterceptor(
  httpClient: AxiosInstance,
  options: AuthInterceptorOptions = {},
) {
  const getToken = options.getToken ?? (() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))
  let refreshRequest: Promise<string> | null = null

  async function refreshToken(token: string): Promise<string> {
    const response = (await httpClient.post('/auth/refresh', { token })) as AxiosResponse<
      ApiResponse<{ token: string }>
    >

    return response.data.data.token
  }

  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retryAuthRefresh ||
        isAuthEndpoint(originalRequest.url)
      ) {
        if (error.response?.status === 401) {
          options.onUnauthorized?.()
        }

        return Promise.reject(error)
      }

      const token = getToken()

      if (!token) {
        options.onUnauthorized?.()
        return Promise.reject(error)
      }

      originalRequest._retryAuthRefresh = true

      try {
        refreshRequest ??= refreshToken(token).finally(() => {
          refreshRequest = null
        })

        const nextToken = await refreshRequest
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken)
        options.onTokenRefreshed?.(nextToken)
        originalRequest.headers.Authorization = `Bearer ${nextToken}`

        return httpClient.request(originalRequest)
      } catch {
        options.onUnauthorized?.()
        return Promise.reject(error)
      }
    },
  )
}
