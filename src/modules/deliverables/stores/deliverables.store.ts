import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  apiClient,
  type CreateDeliverableRequest,
  type UpdateDeliverableRequest,
} from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import type { Deliverable } from '@/shared/types/api-contracts'

export type DeliverableListFilters = {
  status?: Deliverable['status']
}

export const useDeliverablesStore = defineStore('deliverables', () => {
  const deliverables = ref<Deliverable[]>([])
  const selectedDeliverable = ref<Deliverable | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(12)
  const filters = ref<DeliverableListFilters>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const openDeliverables = computed(() =>
    deliverables.value.filter((deliverable) => deliverable.status !== 'done'),
  )

  async function loadDeliverables(
    projectId: string,
    nextPage = page.value,
    nextFilters = filters.value,
  ) {
    isLoading.value = true
    error.value = null
    page.value = nextPage
    filters.value = nextFilters.status ? { status: nextFilters.status } : {}

    try {
      const response = await apiClient.deliverables.list({
        projectId,
        page: page.value,
        pageSize: pageSize.value,
        ...filters.value,
      })
      deliverables.value = response.items
      total.value = response.total
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os entregaveis.')
    } finally {
      isLoading.value = false
    }
  }

  async function loadDeliverable(id: string) {
    isLoading.value = true
    error.value = null

    try {
      selectedDeliverable.value = await apiClient.deliverables.get(id)
      return selectedDeliverable.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar o entregavel.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createDeliverable(input: CreateDeliverableRequest) {
    isSaving.value = true
    error.value = null

    try {
      const created = await apiClient.deliverables.create(input)
      selectedDeliverable.value = created
      await loadDeliverables(input.projectId, 1)
      return created
    } catch (createError) {
      error.value = getApiErrorMessage(createError, 'Nao foi possivel criar o entregavel.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateDeliverable(id: string, projectId: string, input: UpdateDeliverableRequest) {
    isSaving.value = true
    error.value = null

    try {
      const updated = await apiClient.deliverables.update(id, input)
      selectedDeliverable.value = updated
      await loadDeliverables(projectId)
      return updated
    } catch (updateError) {
      error.value = getApiErrorMessage(updateError, 'Nao foi possivel atualizar o entregavel.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  function clearSelected() {
    selectedDeliverable.value = null
  }

  return {
    deliverables,
    selectedDeliverable,
    total,
    page,
    pageSize,
    filters,
    isLoading,
    isSaving,
    error,
    openDeliverables,
    loadDeliverables,
    loadDeliverable,
    createDeliverable,
    updateDeliverable,
    clearSelected,
  }
})
