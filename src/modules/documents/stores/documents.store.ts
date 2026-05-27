import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  apiClient,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
  type UploadDocumentVersionRequest,
} from '@/shared/http/api-client'
import type {
  Deliverable,
  DocumentDetail,
  DocumentStatus,
  DocumentSummary,
  DocumentType,
} from '@/shared/types/api-contracts'
import { getApiErrorMessage } from '@/shared/http/api-error'

export type DocumentListFilters = {
  projectId?: string
  deliverableId?: string
  status?: DocumentStatus
  type?: DocumentType
}

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<DocumentSummary[]>([])
  const selectedDocument = ref<DocumentDetail | null>(null)
  const availableDeliverables = ref<Deliverable[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const filters = ref<DocumentListFilters>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const officialDocuments = computed(() =>
    documents.value.filter((document) => document.status === 'approved'),
  )

  async function loadDocuments(nextPage = page.value, nextFilters = filters.value) {
    isLoading.value = true
    error.value = null
    page.value = nextPage
    filters.value = removeEmptyFilters(nextFilters)

    try {
      const response = await apiClient.documents.list({
        page: page.value,
        pageSize: pageSize.value,
        ...filters.value,
      })
      documents.value = response.items
      total.value = response.total
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar os documentos.')
    } finally {
      isLoading.value = false
    }
  }

  async function loadDocument(documentId: string) {
    isLoading.value = true
    error.value = null

    try {
      selectedDocument.value = await apiClient.documents.get(documentId)
      return selectedDocument.value
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Nao foi possivel carregar o documento.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadDeliverablesForProject(projectId: string) {
    if (!projectId) {
      availableDeliverables.value = []
      return
    }

    try {
      const response = await apiClient.deliverables.list({ projectId, page: 1, pageSize: 100 })
      availableDeliverables.value = response.items
    } catch {
      availableDeliverables.value = []
    }
  }

  async function createDocument(input: CreateDocumentRequest) {
    isSaving.value = true
    error.value = null

    try {
      const created = await apiClient.documents.create(input)
      selectedDocument.value = created
      await loadDocuments(1)
      return created
    } catch (createError) {
      error.value = getApiErrorMessage(createError, 'Nao foi possivel criar o documento tecnico.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateDocument(documentId: string, input: UpdateDocumentRequest) {
    isSaving.value = true
    error.value = null

    try {
      const updated = await apiClient.documents.update(documentId, input)
      selectedDocument.value = updated
      await loadDocuments(page.value)
      return updated
    } catch (updateError) {
      error.value = getApiErrorMessage(updateError, 'Nao foi possivel atualizar o documento.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function uploadVersion(documentId: string, input: UploadDocumentVersionRequest) {
    isSaving.value = true
    error.value = null

    try {
      const updated = await apiClient.documents.uploadVersion(documentId, input)
      selectedDocument.value = updated
      await loadDocuments(page.value)
      return updated
    } catch (uploadError) {
      error.value = getApiErrorMessage(
        uploadError,
        'Nao foi possivel enviar a versao do documento.',
      )
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deleteDocument(documentId: string) {
    isSaving.value = true
    error.value = null

    try {
      await apiClient.documents.delete(documentId)
      if (selectedDocument.value?.id === documentId) {
        selectedDocument.value = null
      }
      await loadDocuments(page.value)
      return true
    } catch (deleteError) {
      error.value = getApiErrorMessage(deleteError, 'Nao foi possivel excluir o documento.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    documents,
    selectedDocument,
    availableDeliverables,
    total,
    page,
    pageSize,
    filters,
    isLoading,
    isSaving,
    error,
    officialDocuments,
    loadDocuments,
    loadDocument,
    loadDeliverablesForProject,
    createDocument,
    updateDocument,
    uploadVersion,
    deleteDocument,
  }
})

function removeEmptyFilters(filters: DocumentListFilters): DocumentListFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value)),
  ) as DocumentListFilters
}
