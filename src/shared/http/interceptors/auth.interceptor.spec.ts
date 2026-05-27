import axios, { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_TOKEN_STORAGE_KEY } from '@/modules/auth/constants/auth-storage.constants'
import { registerAuthInterceptor } from './auth.interceptor'

function unauthorizedError(config: InternalAxiosRequestConfig) {
  return Object.assign(new Error('Unauthorized'), {
    config,
    response: {
      config,
      data: { code: 'UnauthorizedException', message: 'Unauthorized' },
      headers: {},
      status: 401,
      statusText: 'Unauthorized',
    },
  })
}

describe('auth interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('refreshes the token, stores it, and retries the original request once', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'expired-token')
    const onTokenRefreshed = vi.fn()
    let protectedAttempts = 0

    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/refresh') {
        expect(config.data).toBe(JSON.stringify({ token: 'expired-token' }))

        return {
          config,
          data: { data: { token: 'fresh-token' } },
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      }

      if (config.url === '/projects') {
        protectedAttempts += 1

        if (protectedAttempts === 1) {
          throw unauthorizedError(config)
        }

        expect(config.headers.Authorization).toBe('Bearer fresh-token')

        return {
          config,
          data: { data: [{ id: 'project-1' }] },
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      }

      throw new Error(`Unexpected request: ${config.url}`)
    }

    const client = axios.create({ adapter })
    registerAuthInterceptor(client, { onTokenRefreshed })

    const response = await client.get('/projects')

    expect(response.data).toEqual({ data: [{ id: 'project-1' }] })
    expect(protectedAttempts).toBe(2)
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('fresh-token')
    expect(onTokenRefreshed).toHaveBeenCalledWith('fresh-token')
  })

  it('does not refresh auth endpoint failures and notifies unauthorized state', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'expired-token')
    const onUnauthorized = vi.fn()
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/login') {
        throw unauthorizedError(config)
      }

      throw new Error(`Unexpected request: ${config.url}`)
    }
    const client = axios.create({
      adapter,
      headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
    })
    registerAuthInterceptor(client, { onUnauthorized })

    await expect(client.post('/auth/login', {})).rejects.toThrow('Unauthorized')

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
