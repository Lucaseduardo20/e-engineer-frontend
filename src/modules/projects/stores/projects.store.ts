import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { projectsService } from '@/modules/projects/services/projects.service'
import type { Deliverable, Project, ProjectKnowledgeItem } from '@/shared/types/api-contracts'
import type { PromoteProjectToKnowledgeDto } from '@/modules/knowledge-base/types/knowledge.types'
import type { CreateProjectRequest } from '@/shared/http/api'
import { getApiErrorMessage } from '@/shared/http/api-error'

export type ProjectListFilters = {
  name?: string
  status?: Project['status']
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const selectedProject = ref<Project | null>(null)
  const deliverables = ref<Deliverable[]>([])
  const projectKnowledge = ref<ProjectKnowledgeItem[]>([])
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
      const [project, deliverablePage, knowledgeResponse] = await Promise.all([
        projectsService.getById(projectId),
        apiClient.deliverables.list({ projectId, page: 1, pageSize: 50 }),
        apiClient.projects.listKnowledge(projectId),
      ])
      selectedProject.value = project
      deliverables.value = deliverablePage.items
      projectKnowledge.value = knowledgeResponse.items
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

  async function linkKnowledgeItem(projectId: string, payload: { knowledgeItemId: string; relationType: string }) {
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

  return {
    projects,
    selectedProject,
    deliverables,
    projectKnowledge,
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
    linkKnowledgeItem,
    unlinkKnowledgeRelation,
    updateProjectStatus,
    promoteProjectToKnowledge,
  }
})
