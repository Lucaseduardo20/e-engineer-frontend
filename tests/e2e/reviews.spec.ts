import { describe, expect, it } from 'vitest'

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000'

type ApiResponse<T> = { data: T }
type AuthToken = { token: string; user: { organizationId: string } }
type Paginated<T> = { items: T[]; total: number }
type Project = { id: string; name: string }
type User = { id: string; email: string }
type Review = { id: string; projectId: string; status: string; comment?: string | null }

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`)
  }

  return JSON.parse(body) as T
}

describe('Reviews integration', () => {
  it('creates, lists, approves and rejects reviews', async () => {
    const login = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@engflow.local',
        password: '123123lucas',
      }),
    }).then((response) => readJson<ApiResponse<AuthToken>>(response))
    const authHeaders = { Authorization: `Bearer ${login.data.token}` }
    const [projects, users] = await Promise.all([
      fetch(`${apiUrl}/projects`, { headers: authHeaders }).then((response) =>
        readJson<ApiResponse<Paginated<Project>>>(response),
      ),
      fetch(`${apiUrl}/organizations/current/users`, { headers: authHeaders }).then((response) =>
        readJson<ApiResponse<User[]>>(response),
      ),
    ])
    const projectId = projects.data.items[0]?.id
    const reviewerId = users.data[1]?.id ?? users.data[0]?.id
    expect(projectId).toEqual(expect.any(String))
    expect(reviewerId).toEqual(expect.any(String))

    const created = await fetch(`${apiUrl}/reviews`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        reviewers: [reviewerId],
        comment: `Revisao E2E ${Date.now()}`,
      }),
    }).then((response) => readJson<ApiResponse<Review>>(response))

    expect(created.data.status).toBe('pending')

    const listed = await fetch(`${apiUrl}/reviews?projectId=${projectId}`, {
      headers: authHeaders,
    }).then((response) => readJson<ApiResponse<Paginated<Review>>>(response))
    expect(listed.data.items.some((review) => review.id === created.data.id)).toBe(true)

    const approved = await fetch(`${apiUrl}/reviews/${created.data.id}/approve`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Aprovado via E2E.' }),
    }).then((response) => readJson<ApiResponse<Review>>(response))
    expect(approved.data.status).toBe('approved')

    const second = await fetch(`${apiUrl}/reviews`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        reviewers: [reviewerId],
        comment: `Revisao para rejeitar ${Date.now()}`,
      }),
    }).then((response) => readJson<ApiResponse<Review>>(response))

    const rejected = await fetch(`${apiUrl}/reviews/${second.data.id}/reject`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Rejeitado via E2E.' }),
    }).then((response) => readJson<ApiResponse<Review>>(response))
    expect(rejected.data.status).toBe('rejected')
  }, 20_000)
})
