import axios from 'axios'
import { registerAuthInterceptor } from '@/shared/http/interceptors/auth.interceptor'

function resolveApiBaseUrl(value?: string): string {
  const apiUrl = value?.trim()

  if (!apiUrl) {
    return ''
  }

  const normalizedApiUrl = apiUrl.replace(/\/+$/, '')

  if (/^https?:\/\//i.test(normalizedApiUrl)) {
    return normalizedApiUrl
  }

  const protocol = normalizedApiUrl.startsWith('localhost') ? 'http' : 'https'

  return `${protocol}://${normalizedApiUrl}`
}

export const httpClient = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let unauthorizedHandler: (() => void) | null = null
let tokenRefreshHandler: ((token: string) => void) | null = null

registerAuthInterceptor(httpClient, {
  onTokenRefreshed: (token) => {
    tokenRefreshHandler?.(token)
  },
  onUnauthorized: () => {
    unauthorizedHandler?.()
  },
})

export function configureUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export function configureTokenRefreshHandler(handler: (token: string) => void) {
  tokenRefreshHandler = handler
}
