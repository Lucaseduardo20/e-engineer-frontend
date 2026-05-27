import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { useDeliverablesStore } from './deliverables.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    deliverables: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('deliverables store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads deliverables with project, status and pagination', async () => {
    vi.mocked(apiClient.deliverables.list).mockResolvedValue({
      items: [
        {
          id: 'd1',
          projectId: 'p1',
          title: 'Memorial descritivo',
          status: 'todo',
          type: 'descriptive_memorial',
          assignees: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
    })
    const store = useDeliverablesStore()

    await store.loadDeliverables('p1', 1, { status: 'todo' })

    expect(apiClient.deliverables.list).toHaveBeenCalledWith({
      projectId: 'p1',
      page: 1,
      pageSize: 12,
      status: 'todo',
    })
    expect(store.deliverables).toHaveLength(1)
    expect(store.openDeliverables).toHaveLength(1)
  })

  it('creates a deliverable and reloads the project list', async () => {
    vi.mocked(apiClient.deliverables.create).mockResolvedValue({
      id: 'd1',
      projectId: 'p1',
      title: 'Projeto estrutural',
      status: 'todo',
      type: 'structural_project',
      assignees: ['Lucas'],
    })
    vi.mocked(apiClient.deliverables.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
    })
    const store = useDeliverablesStore()

    const created = await store.createDeliverable({
      projectId: 'p1',
      title: 'Projeto estrutural',
      status: 'todo',
      type: 'structural_project',
      assignees: ['Lucas'],
    })

    expect(created?.id).toBe('d1')
    expect(apiClient.deliverables.list).toHaveBeenCalledWith({
      projectId: 'p1',
      page: 1,
      pageSize: 12,
    })
  })

  it('updates a deliverable and keeps the selected record', async () => {
    vi.mocked(apiClient.deliverables.update).mockResolvedValue({
      id: 'd1',
      projectId: 'p1',
      title: 'Projeto estrutural',
      status: 'done',
      type: 'structural_project',
      assignees: ['Lucas'],
    })
    vi.mocked(apiClient.deliverables.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
    })
    const store = useDeliverablesStore()

    const updated = await store.updateDeliverable('d1', 'p1', { status: 'done' })

    expect(apiClient.deliverables.update).toHaveBeenCalledWith('d1', { status: 'done' })
    expect(updated?.status).toBe('done')
    expect(store.selectedDeliverable?.id).toBe('d1')
  })
})
