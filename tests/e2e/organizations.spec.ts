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

type Organization = {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

type User = {
  id: string
  fullName: string
  email: string
  roles: string[]
  organizationId?: string
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`)
  }

  return JSON.parse(body) as T
}

describe('Organizations integration', () => {
  it('serves the organizations route and loads current organization users', async () => {
    const appResponse = await fetch(`${appUrl}/organizations`)
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

    const authHeaders = {
      Authorization: `Bearer ${login.data.token}`,
    }

    const organization = await fetch(`${apiUrl}/organizations/current`, {
      headers: authHeaders,
    }).then((response) => readJson<ApiResponse<Organization>>(response))

    expect(organization.data.id).toBe(login.data.user.organizationId)
    expect(organization.data.slug).toEqual(expect.any(String))

    const users = await fetch(`${apiUrl}/organizations/current/users`, {
      headers: authHeaders,
    }).then((response) => readJson<ApiResponse<User[]>>(response))

    expect(users.data.length).toBeGreaterThan(0)
    expect(users.data.every((user) => user.organizationId === organization.data.id)).toBe(true)
    expect(users.data.some((user) => user.roles.length > 0)).toBe(true)
  })
})
