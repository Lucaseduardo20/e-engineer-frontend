import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import type {
  KnowledgeItem,
  KnowledgeItemDetail,
  KnowledgeItemStatus,
  KnowledgeItemType,
  CreateKnowledgeItemDto,
  LinkKnowledgeItemDto,
  UpdateKnowledgeItemDto,
} from '@/modules/knowledge-base/types/knowledge.types'

export const useKnowledgeItemsStore = defineStore('knowledgeItems', () => {
  const items = ref<KnowledgeItem[]>([])
  const selectedItem = ref<KnowledgeItemDetail | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(12)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const filters = reactive<{
    type?: KnowledgeItemType
    status?: KnowledgeItemStatus
    tags: string[]
    searchQuery: string
  }>({
    status: 'published',
    tags: [],
    searchQuery: '',
  })

  const hasItems = computed(() => items.value.length > 0)

  async function listItems(nextPage = page.value, nextPageSize = pageSize.value) {
    isLoading.value = true
    error.value = null
    page.value = nextPage
    pageSize.value = nextPageSize

    try {
      const response = filters.searchQuery.trim()
        ? await apiClient.knowledgeBase.search(buildParams())
        : await apiClient.knowledgeBase.list(buildParams())
      items.value = response.items
      total.value = response.total
      return response
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar a base.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function searchItems(query: string) {
    filters.searchQuery = query
    return listItems(1)
  }

  async function getItemDetail(id: string) {
    isLoading.value = true
    error.value = null

    try {
      selectedItem.value = await apiClient.knowledgeBase.get(id)
      return selectedItem.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar o item.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(data: CreateKnowledgeItemDto) {
    isSaving.value = true
    error.value = null

    try {
      const created = await apiClient.knowledgeBase.create(data)
      await listItems(1)
      return created
    } catch (createError) {
      error.value = getApiErrorMessage(createError, 'Nao foi possivel criar o item.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(id: string, data: UpdateKnowledgeItemDto) {
    isSaving.value = true
    error.value = null

    try {
      const updated = await apiClient.knowledgeBase.update(id, data)
      await getItemDetail(id)
      await listItems(page.value)
      return updated
    } catch (updateError) {
      error.value = getApiErrorMessage(updateError, 'Nao foi possivel atualizar o item.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function publishItem(id: string) {
    return changeStatus(id, 'publish')
  }

  async function archiveItem(id: string) {
    return changeStatus(id, 'archive')
  }

  async function linkItem(id: string, payload: LinkKnowledgeItemDto) {
    isSaving.value = true
    error.value = null

    try {
      await apiClient.knowledgeBase.link(id, payload)
      return await getItemDetail(id)
    } catch (linkError) {
      error.value = getApiErrorMessage(linkError, 'Nao foi possivel vincular o item.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  function resetFilters() {
    filters.type = undefined
    filters.status = 'published'
    filters.tags = []
    filters.searchQuery = ''
  }

  async function changeStatus(id: string, action: 'publish' | 'archive') {
    isSaving.value = true
    error.value = null

    try {
      const updated =
        action === 'publish'
          ? await apiClient.knowledgeBase.publish(id)
          : await apiClient.knowledgeBase.archive(id)
      await getItemDetail(id)
      await listItems(page.value)
      return updated
    } catch (statusError) {
      error.value = getApiErrorMessage(statusError, 'Nao foi possivel alterar o status.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  function buildParams() {
    return {
      page: page.value,
      pageSize: pageSize.value,
      q: filters.searchQuery.trim() || undefined,
      type: filters.type,
      status: filters.status,
      tags: filters.tags.length ? filters.tags : undefined,
    }
  }

  return {
    items,
    selectedItem,
    total,
    page,
    pageSize,
    isLoading,
    isSaving,
    error,
    filters,
    hasItems,
    listItems,
    searchItems,
    getItemDetail,
    createItem,
    updateItem,
    publishItem,
    archiveItem,
    linkItem,
    resetFilters,
  }
})
