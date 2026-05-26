import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'
import { AUTH_TOKEN_STORAGE_KEY } from '@/modules/auth/constants/auth-storage.constants'

type AuthInterceptorOptions = {
  getToken?: () => string | null
  onUnauthorized?: () => void
}

export function registerAuthInterceptor(
  httpClient: AxiosInstance,
  options: AuthInterceptorOptions = {},
) {
  const getToken = options.getToken ?? (() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))

  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  httpClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        options.onUnauthorized?.()
      }

      return Promise.reject(error)
    },
  )
}

