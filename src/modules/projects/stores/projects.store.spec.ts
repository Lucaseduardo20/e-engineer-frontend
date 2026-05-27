import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { projectsService } from '@/modules/projects/services/projects.service'
import { useProjectsStore } from './projects.store'

vi.mock('@/modules/projects/services/projects.service', () => ({
  projectsService: {
    create: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
  },
}))

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    deliverables: {
      list: vi.fn(),
    },
  },
}))

describe('projects store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads projects with pagination and filters', async () => {
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [
        {
          id: 'project-1',
          name: 'Ponte Norte',
          status: 'active',
          organizationId: 'org-1',
          progress: 35,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    })
    const store = useProjectsStore()

    await store.loadProjects(1, { name: ' ponte ', status: 'active' })

    expect(projectsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      name: 'ponte',
      status: 'active',
    })
    expect(store.projects).toHaveLength(1)
    expect(store.activeProjects).toHaveLength(1)
    expect(store.total).toBe(1)
  })

  it('loads project details and deliverables together', async () => {
    vi.mocked(projectsService.getById).mockResolvedValue({
      id: 'project-1',
      name: 'Ponte Norte',
      status: 'active',
      organizationId: 'org-1',
      progress: 35,
    })
    vi.mocked(apiClient.deliverables.list).mockResolvedValue({
      items: [
        {
          id: 'deliverable-1',
          projectId: 'project-1',
          title: 'Memorial descritivo',
          status: 'todo',
          type: 'descriptive_memorial',
          assignees: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    })
    const store = useProjectsStore()

    await store.loadProjectDetail('project-1')

    expect(store.selectedProject?.id).toBe('project-1')
    expect(store.deliverables).toHaveLength(1)
  })

  it('creates a project and refreshes the first page', async () => {
    vi.mocked(projectsService.create).mockResolvedValue({
      id: 'project-1',
      organizationId: 'org-1',
      name: 'Ponte Norte',
      projectType: 'estrutural',
      status: 'draft',
    })
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    })
    const store = useProjectsStore()

    const created = await store.createProject({
      name: 'Ponte Norte',
      projectType: 'estrutural',
    })

    expect(created?.id).toBe('project-1')
    expect(projectsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
    })
  })
})
