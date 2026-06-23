import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { useKnowledgeItemsStore } from './knowledge-items.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    knowledgeBase: {
      archive: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      link: vi.fn(),
      list: vi.fn(),
      publish: vi.fn(),
      search: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('knowledge items store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads published items', async () => {
    vi.mocked(apiClient.knowledgeBase.list).mockResolvedValue({
      items: [
        {
          id: 'kb-1',
          organizationId: 'org-1',
          title: 'Padrao tecnico',
          type: 'technical_standard',
          status: 'published',
          tags: ['revisao'],
          createdBy: 'user-1',
          updatedBy: 'user-1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
    })
    const store = useKnowledgeItemsStore()

    await store.listItems()

    expect(apiClient.knowledgeBase.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      q: undefined,
      type: undefined,
      status: 'published',
      tags: undefined,
    })
    expect(store.items).toHaveLength(1)
  })

  it('searches by query and creates a new item', async () => {
    vi.mocked(apiClient.knowledgeBase.search).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
    })
    vi.mocked(apiClient.knowledgeBase.create).mockResolvedValue({
      id: 'kb-2',
      organizationId: 'org-1',
      title: 'Licao',
      type: 'lesson_learned',
      status: 'draft',
      tags: [],
      createdBy: 'user-1',
      updatedBy: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    vi.mocked(apiClient.knowledgeBase.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
    })
    const store = useKnowledgeItemsStore()

    await store.searchItems('licao')
    const created = await store.createItem({
      title: 'Licao',
      type: 'lesson_learned',
    })

    expect(apiClient.knowledgeBase.search).toHaveBeenCalled()
    expect(created?.id).toBe('kb-2')
  })
})
