import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { projectsService } from '@/modules/projects/services/projects.service'
import type {
  AuditLogEntry,
  Deliverable,
  DocumentSummary,
  Project,
  ProjectBaseRecommendation,
  ProjectKnowledgeItem,
  ProjectKnowledgeRecommendation,
  ProjectSimilarRecommendation,
  ProjectTechnicalProfile,
  ReviewSummary,
} from '@/shared/types/api-contracts'
import type { PromoteProjectToKnowledgeDto } from '@/modules/knowledge-base/types/knowledge.types'
import type {
  CreateProjectFromBaseRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/shared/http/api'
import { getApiErrorMessage } from '@/shared/http/api-error'

export type ProjectListFilters = {
  name?: string
  status?: Project['status']
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const selectedProject = ref<Project | null>(null)
  const deliverables = ref<Deliverable[]>([])
  const documents = ref<DocumentSummary[]>([])
  const reviews = ref<ReviewSummary[]>([])
  const auditLogs = ref<AuditLogEntry[]>([])
  const projectKnowledge = ref<ProjectKnowledgeItem[]>([])
  const projectKnowledgeRecommendations = ref<ProjectKnowledgeRecommendation[]>([])
  const projectTechnicalProfile = ref<ProjectTechnicalProfile | null>(null)
  const projectBaseRecommendations = ref<ProjectBaseRecommendation[]>([])
  const similarProjectRecommendations = ref<ProjectSimilarRecommendation[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const filters = ref<ProjectListFilters>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const activeProjects = computed(() =>
    projects.value.filter((project) => project.status === 'active'),
  )

  async function loadProjects(nextPage = page.value, nextFilters = filters.value) {
    isLoading.value = true
    error.value = null
    page.value = nextPage
    const normalizedFilters: ProjectListFilters = {}

    if (nextFilters.name?.trim()) {
      normalizedFilters.name = nextFilters.name.trim()
    }

    if (nextFilters.status) {
      normalizedFilters.status = nextFilters.status
    }

    filters.value = normalizedFilters

    try {
      const response = await projectsService.list({
        page: page.value,
        pageSize: pageSize.value,
        ...normalizedFilters,
      })
      projects.value = response.items
      total.value = response.total
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os projetos tecnicos.')
    } finally {
      isLoading.value = false
    }
  }

  async function loadProjectDetail(projectId: string) {
    isLoading.value = true
    error.value = null

    try {
      const [
        project,
        deliverablePage,
        documentPage,
        reviewPage,
        knowledgeResponse,
        knowledgeRecommendationsResponse,
        technicalProfile,
      ] = await Promise.all([
        projectsService.getById(projectId),
        apiClient.deliverables.list({ projectId, page: 1, pageSize: 50 }),
        apiClient.documents.list({ projectId, page: 1, pageSize: 50 }),
        apiClient.reviews.list({ projectId, page: 1, pageSize: 50 }),
        apiClient.projects.listKnowledge(projectId),
        apiClient.projects.recommendKnowledge(projectId),
        projectsService.getTechnicalProfile(projectId),
      ])
      selectedProject.value = project
      deliverables.value = deliverablePage.items
      documents.value = documentPage.items
      reviews.value = reviewPage.items
      projectKnowledge.value = knowledgeResponse.items
      projectKnowledgeRecommendations.value = knowledgeRecommendationsResponse.items
      projectTechnicalProfile.value = technicalProfile
      auditLogs.value = await loadProjectAuditTrail({
        projectId,
        deliverables: deliverablePage.items,
        documents: documentPage.items,
        reviews: reviewPage.items,
        knowledgeItems: knowledgeResponse.items,
      })
    } catch (loadError) {
      error.value = getApiErrorMessage(
        loadError,
        'Nao foi possivel carregar o projeto selecionado.',
      )
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(input: CreateProjectRequest) {
    isLoading.value = true
    error.value = null

    try {
      const createdProject = await projectsService.create(input)
      await loadProjects(1)
      return createdProject
    } catch (createError) {
      error.value = getApiErrorMessage(createError, 'Nao foi possivel criar o projeto tecnico.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createProjectFromBase(input: CreateProjectFromBaseRequest) {
    isLoading.value = true
    error.value = null

    try {
      const createdProject = await projectsService.createFromBase(input)
      await loadProjects(1)
      return createdProject
    } catch (createError) {
      error.value = getApiErrorMessage(
        createError,
        'Nao foi possivel criar o projeto a partir da base selecionada.',
      )
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function recommendProjectBases(tagIds: string[]) {
    if (!tagIds.length) {
      projectBaseRecommendations.value = []
      return []
    }

    try {
      const response = await projectsService.recommendBases({ tagIds, limit: 6 })
      projectBaseRecommendations.value = response.items
      return response.items
    } catch (recommendError) {
      error.value = getApiErrorMessage(
        recommendError,
        'Nao foi possivel recomendar projetos base.',
      )
      projectBaseRecommendations.value = []
      return []
    }
  }

  async function recommendSimilarProjects(tagIds: string[]) {
    if (!tagIds.length) {
      similarProjectRecommendations.value = []
      return []
    }

    try {
      const response = await projectsService.similar({ tagIds, limit: 6 })
      similarProjectRecommendations.value = response.items
      return response.items
    } catch (recommendError) {
      error.value = getApiErrorMessage(
        recommendError,
        'Nao foi possivel recomendar projetos semelhantes.',
      )
      similarProjectRecommendations.value = []
      return []
    }
  }

  async function linkKnowledgeItem(
    projectId: string,
    payload: { knowledgeItemId: string; relationType: string; deliverableId?: string },
  ) {
    try {
      await apiClient.projects.linkKnowledge(projectId, payload)
      await loadProjectDetail(projectId)
      return true
    } catch (errorValue) {
      error.value = getApiErrorMessage(errorValue, "Nao foi possivel atualizar o conhecimento aplicado ao projeto.")
      return false
    }
  }

  async function unlinkKnowledgeRelation(projectId: string, relationId: string) {
    try {
      await apiClient.projects.unlinkKnowledge(projectId, relationId)
      await loadProjectDetail(projectId)
      return true
    } catch (errorValue) {
      error.value = getApiErrorMessage(errorValue, "Nao foi possivel atualizar o conhecimento aplicado ao projeto.")
      return false
    }
  }

  async function updateProjectStatus(projectId: string, status: Project['status']) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await apiClient.projects.updateStatus(projectId, status)
      projects.value = projects.value.map((project) =>
        project.id === projectId ? { ...project, ...updated } : project,
      )

      if (selectedProject.value?.id === projectId) {
        selectedProject.value = { ...selectedProject.value, ...updated }
      }

      return updated
    } catch (updateError) {
      error.value = getApiErrorMessage(
        updateError,
        'Nao foi possivel atualizar o status do projeto.',
      )
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(projectId: string, payload: UpdateProjectRequest) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await projectsService.update(projectId, payload)
      projects.value = projects.value.map((project) =>
        project.id === projectId ? { ...project, ...updated } : project,
      )

      if (selectedProject.value?.id === projectId) {
        selectedProject.value = { ...selectedProject.value, ...updated }
      }

      return updated
    } catch (updateError) {
      error.value = getApiErrorMessage(
        updateError,
        'Nao foi possivel atualizar o projeto tecnico.',
      )
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function promoteProjectToKnowledge(projectId: string, payload: PromoteProjectToKnowledgeDto) {
    try {
      const created = await apiClient.knowledgeBase.promoteProject(projectId, payload)
      await loadProjectDetail(projectId)
      return created
    } catch (errorValue) {
      error.value = getApiErrorMessage(
        errorValue,
        'Nao foi possivel promover o projeto para a Base de Conhecimento.',
      )
      return null
    }
  }

  async function loadProjectAuditTrail(input: {
    projectId: string
    deliverables: Deliverable[]
    documents: DocumentSummary[]
    reviews: ReviewSummary[]
    knowledgeItems: ProjectKnowledgeItem[]
  }) {
    const entities = [
      { entityType: 'project', entityId: input.projectId },
      ...input.deliverables.slice(0, 40).map((item) => ({ entityType: 'deliverable', entityId: item.id })),
      ...input.documents.slice(0, 40).map((item) => ({ entityType: 'document', entityId: item.id })),
      ...input.reviews.slice(0, 40).map((item) => ({ entityType: 'review', entityId: item.id })),
      ...input.knowledgeItems.slice(0, 40).map((item) => ({
        entityType: 'knowledge_item',
        entityId: item.knowledgeItem.id,
      })),
    ]

    const pages = await Promise.all(
      entities.map((entity) =>
        apiClient.audit
          .list({ ...entity, page: 1, pageSize: 8 })
          .catch(() => ({ items: [], total: 0, page: 1, pageSize: 8 })),
      ),
    )
    const entries = pages.flatMap((page) => page.items)
    const uniqueEntries = new Map(entries.map((entry) => [entry.id, entry]))

    return [...uniqueEntries.values()]
      .sort((first, second) => second.occurredAt - first.occurredAt)
      .slice(0, 50)
  }

  return {
    projects,
    selectedProject,
    deliverables,
    documents,
    reviews,
    auditLogs,
    projectKnowledge,
    projectKnowledgeRecommendations,
    projectTechnicalProfile,
    projectBaseRecommendations,
    similarProjectRecommendations,
    total,
    page,
    pageSize,
    filters,
    isLoading,
    error,
    activeProjects,
    loadProjects,
    loadProjectDetail,
    createProject,
    createProjectFromBase,
    recommendProjectBases,
    recommendSimilarProjects,
    linkKnowledgeItem,
    unlinkKnowledgeRelation,
    updateProject,
    updateProjectStatus,
    promoteProjectToKnowledge,
  }
})
