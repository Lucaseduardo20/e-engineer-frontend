import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import type { TechnicalTag, TechnicalTagCategory, TechnicalTagStatus } from '@/shared/types/api-contracts'

export const useTechnicalTagsStore = defineStore('technicalTags', () => {
  const items = ref<TechnicalTag[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const hasItems = computed(() => items.value.length > 0)

  async function load(params: {
    page?: number
    pageSize?: number
    search?: string
    category?: TechnicalTagCategory
    status?: TechnicalTagStatus
    includeArchived?: boolean
  } = {}) {
    isLoading.value = true
    error.value = null
    page.value = params.page ?? page.value
    pageSize.value = params.pageSize ?? pageSize.value
    try {
      const response = await apiClient.technicalTags.list({
        page: page.value,
        limit: pageSize.value,
        search: params.search,
        category: params.category,
        status: params.status,
        includeArchived: params.includeArchived,
      })
      items.value = response.items
      total.value = response.total
      return response
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar tags tecnicas.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: { name: string; category: TechnicalTagCategory; description?: string }) {
    isSaving.value = true
    error.value = null
    try {
      const created = await apiClient.technicalTags.create(payload)
      await load({ page: 1 })
      return created
    } catch (saveError) {
      error.value = getApiErrorMessage(saveError, 'Nao foi possivel criar a tag tecnica.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: string, payload: { name?: string; category?: TechnicalTagCategory; description?: string; status?: TechnicalTagStatus }) {
    isSaving.value = true
    error.value = null
    try {
      const updated = await apiClient.technicalTags.update(id, payload)
      await load({ page: page.value })
      return updated
    } catch (saveError) {
      error.value = getApiErrorMessage(saveError, 'Nao foi possivel atualizar a tag tecnica.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function archive(id: string) {
    isSaving.value = true
    error.value = null
    try {
      const updated = await apiClient.technicalTags.archive(id)
      await load({ page: page.value })
      return updated
    } catch (saveError) {
      error.value = getApiErrorMessage(saveError, 'Nao foi possivel arquivar a tag tecnica.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deprecate(id: string) {
    isSaving.value = true
    error.value = null
    try {
      const updated = await apiClient.technicalTags.deprecate(id)
      await load({ page: page.value })
      return updated
    } catch (saveError) {
      error.value = getApiErrorMessage(saveError, 'Nao foi possivel marcar a tag como obsoleta.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  return { items, total, page, pageSize, isLoading, isSaving, error, hasItems, load, create, update, archive, deprecate }
})
