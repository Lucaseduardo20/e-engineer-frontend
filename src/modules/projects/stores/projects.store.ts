import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import type { Deliverable, Project } from '@/shared/types/api-contracts'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const selectedProject = ref<Project | null>(null)
  const deliverables = ref<Deliverable[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const activeProjects = computed(() =>
    projects.value.filter((project) => project.status === 'active'),
  )

  async function loadProjects(nextPage = page.value) {
    isLoading.value = true
    error.value = null
    page.value = nextPage

    try {
      const response = await apiClient.projects.list({ page: page.value, pageSize: pageSize.value })
      projects.value = response.items
      total.value = response.total
    } catch {
      error.value = 'Nao foi possivel carregar os projetos tecnicos.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadProjectDetail(projectId: string) {
    isLoading.value = true
    error.value = null

    try {
      const [project, deliverablePage] = await Promise.all([
        apiClient.projects.detail(projectId),
        apiClient.deliverables.list({ projectId, page: 1, pageSize: 50 }),
      ])
      selectedProject.value = project
      deliverables.value = deliverablePage.items
    } catch {
      error.value = 'Nao foi possivel carregar o projeto selecionado.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    projects,
    selectedProject,
    deliverables,
    total,
    page,
    pageSize,
    isLoading,
    error,
    activeProjects,
    loadProjects,
    loadProjectDetail,
  }
})
