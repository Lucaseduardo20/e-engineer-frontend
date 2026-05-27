<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DocumentUpload from '@/modules/documents/components/DocumentUpload.vue'
import DocumentsList from '@/modules/documents/components/DocumentsList.vue'
import { useDocumentsStore } from '@/modules/documents/stores/documents.store'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { DocumentStatus, DocumentSummary, DocumentType } from '@/shared/types/api-contracts'

const documentsStore = useDocumentsStore()
const projectsStore = useProjectsStore()

const isFormOpen = ref(false)
const editingDocument = ref<DocumentSummary | null>(null)
const pendingDelete = ref<DocumentSummary | null>(null)
const selectedProjectId = ref<string | null>(null)
const selectedStatus = ref<DocumentStatus | null>(null)
const selectedType = ref<DocumentType | null>(null)

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
const officialCount = computed(() => documentsStore.officialDocuments.length)

onMounted(() => {
  void Promise.all([projectsStore.loadProjects(), documentsStore.loadDocuments()])
})

function openCreateForm() {
  editingDocument.value = null
  isFormOpen.value = true
}

function openUploadForm(document: DocumentSummary) {
  editingDocument.value = document
  isFormOpen.value = true
}

function openEditForm(document: DocumentSummary) {
  editingDocument.value = document
  isFormOpen.value = true
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

  if (!documentsStore.error) {
    isFormOpen.value = false
    editingDocument.value = null
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

    <v-sheet class="documents-page__filters" border rounded="lg">
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
    </v-sheet>

    <DocumentsList
      :documents="documentsStore.documents"
      :loading="documentsStore.isLoading"
      :page="documentsStore.page"
      :page-size="documentsStore.pageSize"
      :total="documentsStore.total"
      @update:page="documentsStore.loadDocuments"
      @upload="openUploadForm"
      @edit="openEditForm"
      @delete="pendingDelete = $event"
    />

    <v-dialog v-model="isFormOpen" max-width="760">
      <DocumentUpload
        :document="editingDocument"
        :projects="projectsStore.projects"
        :deliverables="documentsStore.availableDeliverables"
        :saving="documentsStore.isSaving"
        @project-change="handleProjectChange"
        @submit="handleSubmit"
      />
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

.documents-page__filters {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 14rem) minmax(12rem, 16rem) auto;
  background: #ffffff;
  padding: 0.875rem;
}

.documents-page__filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
}
</style>
