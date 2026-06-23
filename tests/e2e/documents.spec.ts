import { describe, expect, it } from 'vitest'

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000'

type ApiResponse<T> = { data: T }
type AuthToken = { token: string; user: { organizationId: string } }
type Paginated<T> = { items: T[]; total: number }
type Project = { id: string; name: string }
type Document = {
  id: string
  title: string
  status: string
  versions?: Array<{ fileName: string }>
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`)
  }

  return JSON.parse(body) as T
}

describe('Documents integration', () => {
  it('lists, creates, uploads a version and deletes a document', async () => {
    const login = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@engflow.local',
        password: '123123lucas',
      }),
    }).then((response) => readJson<ApiResponse<AuthToken>>(response))
    const authHeaders = { Authorization: `Bearer ${login.data.token}` }
    const projects = await fetch(`${apiUrl}/projects`, { headers: authHeaders }).then((response) =>
      readJson<ApiResponse<Paginated<Project>>>(response),
    )
    const projectId = projects.data.items[0]?.id
    expect(projectId).toEqual(expect.any(String))

    const created = await fetch(`${apiUrl}/documents`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        title: `Documento E2E ${Date.now()}`,
        type: 'laudo',
        status: 'draft',
      }),
    }).then((response) => readJson<ApiResponse<Document>>(response))

    const formData = new FormData()
    formData.append('file', new File(['pdf'], 'laudo-e2e.pdf', { type: 'application/pdf' }))
    formData.append('isOfficial', 'true')
    formData.append('status', 'approved')

    const uploaded = await fetch(`${apiUrl}/documents/${created.data.id}/versions`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    }).then((response) => readJson<ApiResponse<Document>>(response))

    expect(uploaded.data.status).toBe('approved')
    expect(uploaded.data.versions?.[0]?.fileName).toBe('laudo-e2e.pdf')

    const listed = await fetch(`${apiUrl}/documents`, { headers: authHeaders }).then((response) =>
      readJson<ApiResponse<Paginated<Document>>>(response),
    )

    expect(listed.data.items.some((document) => document.id === created.data.id)).toBe(true)

    await fetch(`${apiUrl}/documents/${created.data.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    }).then((response) => readJson<ApiResponse<{ deleted: true }>>(response))
  }, 20_000)
})
