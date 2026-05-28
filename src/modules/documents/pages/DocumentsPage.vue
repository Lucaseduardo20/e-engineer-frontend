<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import DocumentUpload from '@/modules/documents/components/DocumentUpload.vue'
import DocumentsList from '@/modules/documents/components/DocumentsList.vue'
import { useDocumentsStore } from '@/modules/documents/stores/documents.store'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import type { DocumentStatus, DocumentSummary, DocumentType } from '@/shared/types/api-contracts'

const documentsStore = useDocumentsStore()
const projectsStore = useProjectsStore()

const isFormOpen = ref(false)
const isFiltersOpen = ref(false)
const editingDocument = ref<DocumentSummary | null>(null)
const versionDocument = ref<DocumentSummary | null>(null)
const reviewerDocument = ref<DocumentSummary | null>(null)
const pendingDelete = ref<DocumentSummary | null>(null)
const historyDocument = ref<DocumentSummary | null>(null)
const selectedProjectId = ref<string | null>(null)
const selectedStatus = ref<DocumentStatus | null>(null)
const selectedType = ref<DocumentType | null>(null)
const versionForm = reactive({
  file: null as File | null,
  revision: '',
  status: 'draft' as DocumentStatus,
  isOfficial: false,
  notes: '',
})
const reviewerForm = reactive({
  reviewerId: null as string | null,
  comment: '',
})

const statusOptions: Array<{ title: string; value: DocumentStatus }> = [
  { title: 'Minuta', value: 'draft' },
  { title: 'Em revisao', value: 'in_review' },
  { title: 'Aprovado/oficial', value: 'approved' },
  { title: 'Substituido', value: 'superseded' },
]
const typeOptions: Array<{ title: string; value: DocumentType }> = [
  { title: 'Memorial descritivo', value: 'memorial_descritivo' },
  { title: 'Projeto estrutural', value: 'projeto_estrutural' },
  { title: 'Projeto arquitetonico', value: 'projeto_arquitetonico' },
  { title: 'Projeto eletrico', value: 'projeto_eletrico' },
  { title: 'Projeto hidrossanitario', value: 'projeto_hidrossanitario' },
  { title: 'Orcamento', value: 'orcamento' },
  { title: 'Cronograma', value: 'cronograma' },
  { title: 'Laudo tecnico', value: 'laudo' },
  { title: 'Relatorio fotografico', value: 'relatorio_fotografico' },
  { title: 'ART/RRT', value: 'art_rrt' },
  { title: 'Levantamento topografico', value: 'levantamento_topografico' },
  { title: 'Especificacao tecnica', value: 'especificacao_tecnica' },
  { title: 'Outro', value: 'outro' },
]

const projectOptions = computed(() =>
  projectsStore.projects.map((project) => ({ title: project.name, value: project.id })),
)
const reviewerOptions = computed(() =>
  documentsStore.reviewers.map((user) => ({
    title: `${user.fullName} (${user.email})`,
    value: user.id,
  })),
)
const officialCount = computed(() => documentsStore.officialDocuments.length)
const activeFiltersCount = computed(
  () => [selectedProjectId.value, selectedStatus.value, selectedType.value].filter(Boolean).length,
)

onMounted(() => {
  void Promise.all([
    projectsStore.loadProjects(),
    documentsStore.loadDocuments(1, {}),
    documentsStore.loadUsers(),
  ])
})

function openCreateForm() {
  editingDocument.value = null
  isFormOpen.value = true
}

function openUploadForm(document: DocumentSummary) {
  versionDocument.value = document
  versionForm.file = null
  versionForm.revision = ''
  versionForm.status = document.status
  versionForm.isOfficial = document.status === 'approved'
  versionForm.notes = ''
}

function openEditForm(document: DocumentSummary) {
  editingDocument.value = document
  isFormOpen.value = true
}

function openReviewerForm(document: DocumentSummary) {
  reviewerDocument.value = document
  reviewerForm.reviewerId = null
  reviewerForm.comment = `Revisao tecnica do documento ${document.title}`
}

async function openHistory(document: DocumentSummary) {
  historyDocument.value = document
  await Promise.all([
    documentsStore.loadDocument(document.id),
    documentsStore.loadAuditLogs(document.id),
  ])
}

function applyFilters() {
  void documentsStore.loadDocuments(1, {
    projectId: selectedProjectId.value ?? undefined,
    status: selectedStatus.value ?? undefined,
    type: selectedType.value ?? undefined,
  })
}

function clearFilters() {
  selectedProjectId.value = null
  selectedStatus.value = null
  selectedType.value = null
  applyFilters()
}

async function handleProjectChange(projectId: string) {
  await documentsStore.loadDeliverablesForProject(projectId)
}

async function handleSubmit(payload: {
  projectId: string
  deliverableId?: string | null
  title: string
  description?: string | null
  type: DocumentType
  status: DocumentStatus
  file?: File
  revision?: string
  isOfficial: boolean
  notes?: string | null
  reviewerId?: string | null
}) {
  const document = editingDocument.value
    ? await documentsStore.updateDocument(editingDocument.value.id, {
        deliverableId: payload.deliverableId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: payload.status,
      })
    : await documentsStore.createDocument({
        projectId: payload.projectId,
        deliverableId: payload.deliverableId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: payload.status,
      })

  if (document && payload.file) {
    await documentsStore.uploadVersion(document.id, {
      file: payload.file,
      revision: payload.revision,
      isOfficial: payload.isOfficial,
      status: payload.status,
      notes: payload.notes,
    })
  }

  if (document && payload.reviewerId) {
    try {
      await apiClient.reviews.create({
        projectId: document.projectId,
        deliverableId: document.deliverableId,
        documentId: document.id,
        reviewers: [payload.reviewerId],
        comment: `Revisao tecnica do documento ${document.title}`,
      })
    } catch (error) {
      documentsStore.error = getApiErrorMessage(
        error,
        'Documento salvo, mas nao foi possivel vincular o revisor.',
      )
    }
  }

  if (!documentsStore.error) {
    isFormOpen.value = false
    editingDocument.value = null
  }
}

async function uploadStandaloneVersion() {
  if (!versionDocument.value || !versionForm.file) {
    return
  }

  const updated = await documentsStore.uploadVersion(versionDocument.value.id, {
    file: versionForm.file,
    revision: versionForm.revision,
    isOfficial: versionForm.isOfficial,
    status: versionForm.status,
    notes: versionForm.notes.trim() || null,
  })

  if (updated) {
    versionDocument.value = null
  }
}

async function createDocumentReview() {
  if (!reviewerDocument.value || !reviewerForm.reviewerId) {
    return
  }

  documentsStore.error = null

  try {
    await apiClient.reviews.create({
      projectId: reviewerDocument.value.projectId,
      deliverableId: reviewerDocument.value.deliverableId,
      documentId: reviewerDocument.value.id,
      reviewers: [reviewerForm.reviewerId],
      comment:
        reviewerForm.comment.trim() ||
        `Revisao tecnica do documento ${reviewerDocument.value.title}`,
    })
    reviewerDocument.value = null
  } catch (error) {
    documentsStore.error = getApiErrorMessage(error, 'Nao foi possivel vincular o revisor.')
  }
}

async function confirmDelete() {
  if (!pendingDelete.value) {
    return
  }

  const deleted = await documentsStore.deleteDocument(pendingDelete.value.id)

  if (deleted) {
    pendingDelete.value = null
  }
}
</script>

<template>
  <v-container fluid class="documents-page pa-0">
    <BasePageHeader
      eyebrow="Documentacao tecnica"
      title="Documentos"
      description="Controle documentos oficiais, revisoes e arquivos vinculados aos projetos tecnicos."
      :breadcrumbs="['Dashboard', 'Documentos']"
    >
      <template #actions>
        <v-btn color="teal" prepend-icon="$upload" @click="openCreateForm">Novo documento</v-btn>
      </template>
    </BasePageHeader>

    <v-row>
      <v-col cols="12" sm="4">
        <v-card class="documents-page__metric" variant="flat" rounded="lg">
          <span>Acervo</span>
          <strong>{{ documentsStore.total }}</strong>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="documents-page__metric" variant="flat" rounded="lg">
          <span>Oficiais</span>
          <strong>{{ officialCount }}</strong>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="documents-page__metric" variant="flat" rounded="lg">
          <span>Pagina</span>
          <strong>{{ documentsStore.page }}</strong>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="documentsStore.error" type="error" variant="tonal">
      {{ documentsStore.error }}
    </v-alert>

    <v-sheet class="documents-page__filter-shell" border rounded="lg">
      <div class="documents-page__filter-bar">
        <v-btn
          size="small"
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros da tabela
        </v-btn>
        <v-chip v-if="activeFiltersCount" color="teal" variant="tonal" size="small">
          {{ activeFiltersCount }} ativo(s)
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="activeFiltersCount"
          variant="text"
          :disabled="documentsStore.isLoading"
          @click="clearFilters"
        >
          Limpar
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-if="isFiltersOpen" class="documents-page__filters">
          <v-select
            v-model="selectedProjectId"
            :items="projectOptions"
            label="Projeto"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
          <v-select
            v-model="selectedType"
            :items="typeOptions"
            label="Tipo"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
          <div class="documents-page__filter-actions">
            <v-btn variant="outlined" :disabled="documentsStore.isLoading" @click="clearFilters">
              Limpar
            </v-btn>
            <v-btn color="teal" :loading="documentsStore.isLoading" @click="applyFilters">
              Filtrar
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </v-sheet>

    <DocumentsList
      :documents="documentsStore.documents"
      :loading="documentsStore.isLoading"
      :page="documentsStore.page"
      :page-size="documentsStore.pageSize"
      :total="documentsStore.total"
      :users="documentsStore.reviewers"
      @update:page="documentsStore.loadDocuments"
      @upload="openUploadForm"
      @edit="openEditForm"
      @assign="openReviewerForm"
      @history="openHistory"
      @delete="pendingDelete = $event"
    />

    <v-dialog v-model="isFormOpen" max-width="760">
      <DocumentUpload
        :document="editingDocument"
        :projects="projectsStore.projects"
        :deliverables="documentsStore.availableDeliverables"
        :users="documentsStore.reviewers"
        :saving="documentsStore.isSaving"
        @project-change="handleProjectChange"
        @submit="handleSubmit"
      />
    </v-dialog>

    <v-dialog
      :model-value="Boolean(versionDocument)"
      max-width="620"
      @update:model-value="versionDocument = null"
    >
      <v-card rounded="lg">
        <v-card-title>Nova versao</v-card-title>
        <v-card-text class="documents-page__modal-form">
          <v-file-input
            v-model="versionForm.file"
            label="Arquivo"
            variant="outlined"
            density="comfortable"
            prepend-icon=""
            prepend-inner-icon="$upload"
            show-size
            :disabled="documentsStore.isSaving"
          />
          <div class="documents-page__modal-pair">
            <v-text-field
              v-model="versionForm.revision"
              label="Revisao"
              variant="outlined"
              density="comfortable"
              :disabled="documentsStore.isSaving"
            />
            <v-select
              v-model="versionForm.status"
              :items="statusOptions"
              label="Status da versao"
              variant="outlined"
              density="comfortable"
              :disabled="documentsStore.isSaving"
            />
          </div>
          <v-switch
            v-model="versionForm.isOfficial"
            color="teal"
            label="Marcar como versao oficial"
            hide-details
            :disabled="documentsStore.isSaving"
          />
          <v-textarea
            v-model="versionForm.notes"
            label="Notas da versao"
            rows="3"
            variant="outlined"
            density="comfortable"
            :disabled="documentsStore.isSaving"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="documentsStore.isSaving" @click="versionDocument = null">
            Cancelar
          </v-btn>
          <v-btn
            color="teal"
            :loading="documentsStore.isSaving"
            :disabled="!versionForm.file"
            @click="uploadStandaloneVersion"
          >
            Enviar versao
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      :model-value="Boolean(reviewerDocument)"
      max-width="560"
      @update:model-value="reviewerDocument = null"
    >
      <v-card rounded="lg">
        <v-card-title>Gerenciar revisores</v-card-title>
        <v-card-text class="documents-page__modal-form">
          <v-select
            v-model="reviewerForm.reviewerId"
            :items="reviewerOptions"
            label="Revisor responsavel"
            variant="outlined"
            density="comfortable"
            :disabled="documentsStore.isSaving"
          />
          <v-textarea
            v-model="reviewerForm.comment"
            label="Registro da revisao"
            rows="3"
            variant="outlined"
            density="comfortable"
            :disabled="documentsStore.isSaving"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="documentsStore.isSaving"
            @click="reviewerDocument = null"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="teal"
            :loading="documentsStore.isSaving"
            :disabled="!reviewerForm.reviewerId"
            @click="createDocumentReview"
          >
            Solicitar revisao
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      :model-value="Boolean(historyDocument)"
      max-width="760"
      @update:model-value="historyDocument = null"
    >
      <v-card rounded="lg">
        <v-card-title>Historico de versoes</v-card-title>
        <v-card-text class="documents-page__history">
          <v-list v-if="documentsStore.selectedDocument?.versions.length" lines="three">
            <v-list-item
              v-for="version in documentsStore.selectedDocument.versions"
              :key="version.id"
              :title="`Versao ${version.revision}`"
              :subtitle="`${version.fileName} · ${formatDateTime(version.uploadedAt)}`"
            >
              <template #append>
                <v-chip
                  size="small"
                  :color="version.isOfficial ? 'teal' : undefined"
                  variant="tonal"
                >
                  {{ version.isOfficial ? 'Oficial' : version.status }}
                </v-chip>
              </template>
              <div class="documents-page__version-note">
                Autor:
                {{
                  documentsStore.reviewers.find((user) => user.id === version.uploadedBy)
                    ?.fullName ?? version.uploadedBy
                }}
              </div>
              <div v-if="version.notes" class="documents-page__version-note">
                Nota: {{ version.notes }}
              </div>
            </v-list-item>
          </v-list>
          <v-empty-state
            v-else
            headline="Sem versoes anteriores"
            text="O historico aparecera quando novos arquivos forem enviados."
          />

          <v-divider />

          <div class="documents-page__audit-title">Auditoria recente</div>
          <v-list v-if="documentsStore.auditLogs.length" lines="two">
            <v-list-item
              v-for="entry in documentsStore.auditLogs"
              :key="entry.id"
              :title="`${entry.actorName} · ${entry.action}`"
              :subtitle="`${formatDateTime(entry.occurredAt)} · ${entry.description}`"
            />
          </v-list>
          <v-empty-state
            v-else
            headline="Sem auditoria"
            text="Ainda nao ha registros de auditoria para este documento."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="historyDocument = null">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      :model-value="Boolean(pendingDelete)"
      max-width="440"
      @update:model-value="pendingDelete = null"
    >
      <v-card rounded="lg">
        <v-card-title>Excluir documento</v-card-title>
        <v-card-text>
          {{ pendingDelete?.title }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pendingDelete = null">Cancelar</v-btn>
          <v-btn color="red" :loading="documentsStore.isSaving" @click="confirmDelete">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.documents-page {
  display: grid;
  gap: 1rem;
}

.documents-page__metric {
  display: grid;
  gap: 0.15rem;
  border: 1px solid #d7e4df;
  padding: 1rem;
}

.documents-page__metric span {
  color: #63716d;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.documents-page__metric strong {
  color: #123c32;
  font-size: 1.65rem;
  font-weight: 900;
}

.documents-page__filter-shell {
  overflow: hidden;
  background: #ffffff;
}

.documents-page__filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.documents-page__filters {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 14rem) minmax(12rem, 16rem) auto;
  border-top: 1px solid #d8e1de;
  padding: 0.875rem;
}

.documents-page__filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.documents-page__history {
  display: grid;
  gap: 1rem;
}

.documents-page__modal-form {
  display: grid;
  gap: 0.85rem;
}

.documents-page__modal-pair {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.documents-page__version-note {
  color: #63716d;
  font-size: 0.82rem;
}

.documents-page__audit-title {
  color: #123c32;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

@media (max-width: 1040px) {
  .documents-page__filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .documents-page__filters {
    grid-template-columns: 1fr;
  }

  .documents-page__filter-actions {
    justify-content: flex-start;
  }

  .documents-page__modal-pair {
    grid-template-columns: 1fr;
  }
}
</style>
