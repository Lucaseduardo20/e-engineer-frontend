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
    recommendBases: vi.fn(),
  },
}))

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    deliverables: {
      list: vi.fn(),
    },
    documents: {
      list: vi.fn(),
    },
    reviews: {
      list: vi.fn(),
    },
    audit: {
      list: vi.fn(),
    },
    projects: {
      listKnowledge: vi.fn(),
      recommendKnowledge: vi.fn(),
      updateStatus: vi.fn(),
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
    vi.mocked(apiClient.documents.list).mockResolvedValue({
      items: [
        {
          id: 'document-1',
          projectId: 'project-1',
          title: 'Prancha tecnica',
          type: 'projeto_arquitetonico',
          status: 'approved',
          updatedAt: Date.now(),
          officialVersion: null,
          latestVersion: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    })
    vi.mocked(apiClient.reviews.list).mockResolvedValue({
      items: [
        {
          id: 'review-1',
          projectId: 'project-1',
          status: 'pending',
          requestedBy: 'user-1',
          reviewers: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    })
    vi.mocked(apiClient.projects.listKnowledge).mockResolvedValue({ items: [] })
    vi.mocked(apiClient.projects.recommendKnowledge).mockResolvedValue({ items: [] })
    vi.mocked(apiClient.audit.list).mockResolvedValue({
      items: [
        {
          id: 'audit-1',
          actorName: 'Lucas',
          action: 'project.updated',
          entityType: 'project',
          entityId: 'project-1',
          description: 'Projeto atualizado',
          occurredAt: Date.now(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    })
    const store = useProjectsStore()

    await store.loadProjectDetail('project-1')

    expect(store.selectedProject?.id).toBe('project-1')
    expect(store.deliverables).toHaveLength(1)
    expect(store.documents).toHaveLength(1)
    expect(store.reviews).toHaveLength(1)
    expect(store.projectKnowledgeRecommendations).toHaveLength(0)
    expect(store.auditLogs).toHaveLength(1)
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

  it('loads project base recommendations by selected tags', async () => {
    vi.mocked(projectsService.recommendBases).mockResolvedValue({
      items: [
        {
          project: {
            id: 'base-1',
            name: 'UBS modelo',
            status: 'active',
            progress: 80,
          },
          matchedTags: [],
          deliverablesPreview: [],
          documentsPreview: [],
          reviewsCount: 0,
          score: 10,
        },
      ],
    })
    const store = useProjectsStore()

    const items = await store.recommendProjectBases(['tag-1'])

    expect(projectsService.recommendBases).toHaveBeenCalledWith({
      tagIds: ['tag-1'],
      limit: 6,
    })
    expect(items).toHaveLength(1)
    expect(store.projectBaseRecommendations[0]?.project.name).toBe('UBS modelo')
  })
})
