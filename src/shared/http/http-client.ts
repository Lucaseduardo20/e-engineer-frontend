import axios from 'axios'
import { registerAuthInterceptor } from '@/shared/http/interceptors/auth.interceptor'

// const DEFAULT_API_URL = 'http://localhost:3000'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
