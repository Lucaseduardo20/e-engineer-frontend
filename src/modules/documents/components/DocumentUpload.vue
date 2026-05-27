<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
  Deliverable,
  DocumentStatus,
  DocumentSummary,
  DocumentType,
  Project,
} from '@/shared/types/api-contracts'

const props = withDefaults(
  defineProps<{
    projects: Project[]
    deliverables?: Deliverable[]
    document?: DocumentSummary | null
    saving?: boolean
  }>(),
  {
    deliverables: () => [],
    document: null,
  },
)

const emit = defineEmits<{
  submit: [
    payload: {
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
    },
  ]
  'project-change': [projectId: string]
}>()

const documentTypeOptions: Array<{ title: string; value: DocumentType }> = [
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

const statusOptions: Array<{ title: string; value: DocumentStatus }> = [
  { title: 'Minuta', value: 'draft' },
  { title: 'Em revisao', value: 'in_review' },
  { title: 'Aprovado/oficial', value: 'approved' },
  { title: 'Substituido', value: 'superseded' },
]

const form = reactive({
  projectId: '',
  deliverableId: null as string | null,
  title: '',
  description: '',
  type: 'memorial_descritivo' as DocumentType,
  status: 'draft' as DocumentStatus,
  revision: '',
  isOfficial: false,
  notes: '',
})
const selectedFile = ref<File | null>(null)

const projectOptions = computed(() =>
  props.projects.map((project) => ({ title: project.name, value: project.id })),
)
const deliverableOptions = computed(() =>
  props.deliverables.map((deliverable) => ({
    title: deliverable.title,
    value: deliverable.id,
  })),
)
const isEditing = computed(() => Boolean(props.document))
const canSubmit = computed(() =>
  Boolean(form.projectId && form.title.trim() && form.type && form.status),
)

watch(
  () => props.document,
  (document) => {
    form.projectId = document?.projectId ?? ''
    form.deliverableId = document?.deliverableId ?? null
    form.title = document?.title ?? ''
    form.description = document?.description ?? ''
    form.type = document?.type ?? 'memorial_descritivo'
    form.status = document?.status ?? 'draft'
    form.revision = ''
    form.isOfficial = document?.status === 'approved'
    form.notes = ''
    selectedFile.value = null

    if (form.projectId) {
      emit('project-change', form.projectId)
    }
  },
  { immediate: true },
)

watch(
  () => form.projectId,
  (projectId) => {
    form.deliverableId = null
    emit('project-change', projectId)
  },
)

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('submit', {
    projectId: form.projectId,
    deliverableId: form.deliverableId,
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    file: selectedFile.value ?? undefined,
    revision: form.revision.trim() || undefined,
    isOfficial: form.isOfficial,
    notes: form.notes.trim() || null,
  })
}
</script>

<template>
  <v-card class="document-upload" variant="flat" rounded="lg">
    <v-card-title class="document-upload__title">
      <v-icon :icon="isEditing ? '$edit' : '$upload'" color="teal" size="20" />
      {{ isEditing ? 'Atualizar documento' : 'Novo documento' }}
    </v-card-title>
    <v-divider />
    <v-card-text class="document-upload__form">
      <v-select
        v-model="form.projectId"
        :items="projectOptions"
        label="Projeto tecnico"
        variant="outlined"
        density="comfortable"
        :disabled="saving || isEditing"
        :rules="[(value: string) => Boolean(value) || 'Selecione o projeto.']"
      />
      <v-select
        v-model="form.deliverableId"
        :items="deliverableOptions"
        label="Entregavel vinculado"
        variant="outlined"
        density="comfortable"
        clearable
        :disabled="saving || !form.projectId"
      />
      <v-text-field
        v-model="form.title"
        label="Titulo tecnico"
        maxlength="180"
        counter
        variant="outlined"
        density="comfortable"
        :disabled="saving"
        :rules="[(value: string) => Boolean(value?.trim()) || 'Informe o titulo.']"
      />
      <v-textarea
        v-model="form.description"
        label="Descricao"
        rows="3"
        maxlength="2000"
        variant="outlined"
        density="comfortable"
        :disabled="saving"
      />
      <div class="document-upload__pair">
        <v-select
          v-model="form.type"
          :items="documentTypeOptions"
          label="Tipo de documento"
          variant="outlined"
          density="comfortable"
          :disabled="saving"
        />
        <v-select
          v-model="form.status"
          :items="statusOptions"
          label="Status"
          variant="outlined"
          density="comfortable"
          :disabled="saving"
        />
      </div>
      <v-file-input
        v-model="selectedFile"
        label="Arquivo da versao"
        variant="outlined"
        density="comfortable"
        prepend-icon=""
        prepend-inner-icon="$upload"
        show-size
        :disabled="saving"
      />
      <div class="document-upload__pair">
        <v-text-field
          v-model="form.revision"
          label="Revisao"
          maxlength="20"
          variant="outlined"
          density="comfortable"
          :disabled="saving"
        />
        <v-switch
          v-model="form.isOfficial"
          color="teal"
          label="Versao oficial"
          :disabled="saving"
          hide-details
        />
      </div>
      <v-textarea
        v-model="form.notes"
        label="Notas da versao"
        rows="2"
        maxlength="2000"
        variant="outlined"
        density="comfortable"
        :disabled="saving"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="teal" :loading="saving" :disabled="!canSubmit" @click="submit">
        {{ isEditing ? 'Salvar' : 'Cadastrar' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.document-upload {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.document-upload__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #123c32;
  font-weight: 850;
}

.document-upload__form {
  display: grid;
  gap: 0.75rem;
}

.document-upload__pair {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .document-upload__pair {
    grid-template-columns: 1fr;
  }
}
</style>
