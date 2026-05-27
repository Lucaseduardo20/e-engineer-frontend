import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { useDocumentsStore } from './documents.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    deliverables: {
      list: vi.fn(),
    },
    documents: {
      create: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      uploadVersion: vi.fn(),
    },
  },
}))

describe('documents store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads documents with pagination and filters', async () => {
    vi.mocked(apiClient.documents.list).mockResolvedValue({
      items: [
        {
          id: 'document-1',
          projectId: 'project-1',
          title: 'Laudo tecnico',
          type: 'laudo',
          status: 'approved',
          updatedAt: '2026-05-27T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    })
    const store = useDocumentsStore()

    await store.loadDocuments(1, { projectId: 'project-1', status: 'approved' })

    expect(apiClient.documents.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      projectId: 'project-1',
      status: 'approved',
    })
    expect(store.documents).toHaveLength(1)
    expect(store.officialDocuments).toHaveLength(1)
  })

  it('creates a document and uploads a new version', async () => {
    vi.mocked(apiClient.documents.create).mockResolvedValue({
      id: 'document-1',
      projectId: 'project-1',
      title: 'Memorial',
      type: 'memorial_descritivo',
      status: 'draft',
      updatedAt: '2026-05-27T00:00:00.000Z',
      versions: [],
    })
    vi.mocked(apiClient.documents.uploadVersion).mockResolvedValue({
      id: 'document-1',
      projectId: 'project-1',
      title: 'Memorial',
      type: 'memorial_descritivo',
      status: 'approved',
      updatedAt: '2026-05-27T00:00:00.000Z',
      versions: [],
    })
    vi.mocked(apiClient.documents.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    })
    const store = useDocumentsStore()
    const file = new File(['pdf'], 'memorial.pdf', { type: 'application/pdf' })

    const created = await store.createDocument({
      projectId: 'project-1',
      title: 'Memorial',
      type: 'memorial_descritivo',
      status: 'draft',
    })
    await store.uploadVersion(created?.id ?? '', {
      file,
      isOfficial: true,
      status: 'approved',
    })

    expect(apiClient.documents.create).toHaveBeenCalled()
    expect(apiClient.documents.uploadVersion).toHaveBeenCalledWith('document-1', {
      file,
      isOfficial: true,
      status: 'approved',
    })
  })
})
