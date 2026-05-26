import { describe, expect, it } from 'vitest'

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000'
const appUrl = process.env.E2E_APP_URL ?? 'http://localhost:5173'

type ApiResponse<T> = {
  data: T
}

type AuthToken = {
  token: string
  user: {
    email: string
    organizationId: string
  }
}

type Project = {
  id: string
  name: string
  status: string
  organizationId: string
}

type Paginated<T> = {
  items: T[]
  total: number
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`)
  }

  return JSON.parse(body) as T
}

describe('Sprint 0 MVP integration', () => {
  it(
    'serves the app and completes login, project list, project create, and token refresh',
    async () => {
      const appResponse = await fetch(appUrl)
      expect(appResponse.ok).toBe(true)
      await expect(appResponse.text()).resolves.toContain('id="app"')

      const login = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@engflow.local',
          password: '123123lucas',
        }),
      }).then((response) => readJson<ApiResponse<AuthToken>>(response))

      expect(login.data.token).toEqual(expect.any(String))
      expect(login.data.user.email).toBe('admin@engflow.local')

      const authHeaders = {
        Authorization: `Bearer ${login.data.token}`,
      }

      const beforeCreate = await fetch(`${apiUrl}/projects`, {
        headers: authHeaders,
      }).then((response) => readJson<ApiResponse<Paginated<Project>>>(response))

      expect(beforeCreate.data.items.length).toBeGreaterThan(0)

      const projectName = `Sprint 0 E2E ${Date.now()}`
      const created = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          projectType: 'validacao tecnica',
        }),
      }).then((response) => readJson<ApiResponse<Project>>(response))

      expect(created.data.name).toBe(projectName)
      expect(created.data.organizationId).toBe(login.data.user.organizationId)

      const afterCreate = await fetch(`${apiUrl}/projects`, {
        headers: authHeaders,
      }).then((response) => readJson<ApiResponse<Paginated<Project>>>(response))

      expect(afterCreate.data.total).toBeGreaterThanOrEqual(beforeCreate.data.total + 1)
      expect(afterCreate.data.items.some((project) => project.name === projectName)).toBe(true)

      const refreshed = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: login.data.token }),
      }).then((response) => readJson<ApiResponse<{ token: string }>>(response))

      expect(refreshed.data.token).toEqual(expect.any(String))
    },
    20_000,
  )
})
