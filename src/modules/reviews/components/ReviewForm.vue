<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { dateInputToTimestamp } from '@/shared/formatters/date.formatter'
import type { Deliverable, DocumentSummary, Project, User } from '@/shared/types/api-contracts'

const props = withDefaults(
  defineProps<{
    projects: Project[]
    deliverables?: Deliverable[]
    documents?: DocumentSummary[]
    users: User[]
    saving?: boolean
  }>(),
  {
    deliverables: () => [],
    documents: () => [],
  },
)

const emit = defineEmits<{
  submit: [
    payload: {
      projectId: string
      deliverableId?: string | null
      documentId?: string | null
      reviewers: string[]
      dueDate?: number | null
      comment?: string | null
    },
  ]
  'project-change': [projectId: string]
}>()

const form = reactive({
  projectId: '',
  deliverableId: null as string | null,
  documentId: null as string | null,
  reviewers: [] as string[],
  dueDate: '',
  comment: '',
})

const projectOptions = computed(() =>
  props.projects.map((project) => ({ title: project.name, value: project.id })),
)
const deliverableOptions = computed(() =>
  props.deliverables.map((deliverable) => ({ title: deliverable.title, value: deliverable.id })),
)
const documentOptions = computed(() =>
  props.documents.map((document) => ({ title: document.title, value: document.id })),
)
const reviewerOptions = computed(() =>
  props.users.map((user) => ({
    title: `${user.fullName} (${user.email})`,
    value: user.id,
  })),
)
const canSubmit = computed(() =>
  Boolean(form.projectId && form.reviewers.length > 0 && form.comment.trim()),
)

watch(
  () => form.projectId,
  (projectId) => {
    form.deliverableId = null
    form.documentId = null
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
    documentId: form.documentId,
    reviewers: form.reviewers,
    dueDate: dateInputToTimestamp(form.dueDate),
    comment: form.comment.trim() || null,
  })
}
</script>

<template>
  <v-card class="review-form" variant="flat" rounded="lg">
    <v-card-title class="review-form__title">
      <v-icon icon="$search" color="amber" size="20" />
      Nova revisao tecnica
    </v-card-title>
    <v-divider />
    <v-card-text class="review-form__body">
      <v-select
        v-model="form.projectId"
        :items="projectOptions"
        label="Projeto tecnico"
        variant="outlined"
        density="comfortable"
        :disabled="saving"
        :rules="[(value: string) => Boolean(value) || 'Selecione o projeto.']"
      />
      <div class="review-form__pair">
        <v-select
          v-model="form.deliverableId"
          :items="deliverableOptions"
          label="Entregavel"
          variant="outlined"
          density="comfortable"
          clearable
          :disabled="saving || !form.projectId"
        />
        <v-select
          v-model="form.documentId"
          :items="documentOptions"
          label="Documento"
          variant="outlined"
          density="comfortable"
          clearable
          :disabled="saving || !form.projectId"
        />
      </div>
      <v-select
        v-model="form.reviewers"
        :items="reviewerOptions"
        label="Revisores"
        variant="outlined"
        density="comfortable"
        multiple
        chips
        closable-chips
        :disabled="saving"
        :rules="[(value: string[]) => value.length > 0 || 'Selecione ao menos um revisor.']"
      />
      <v-text-field
        v-model="form.dueDate"
        type="date"
        label="Prazo alvo"
        variant="outlined"
        density="comfortable"
        :disabled="saving"
      />
      <v-textarea
        v-model="form.comment"
        label="Descricao da revisao"
        rows="4"
        maxlength="2000"
        counter
        variant="outlined"
        density="comfortable"
        :disabled="saving"
        :rules="[(value: string) => Boolean(value?.trim()) || 'Descreva o ponto de revisao.']"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="teal" :loading="saving" :disabled="!canSubmit" @click="submit">
        Solicitar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.review-form {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.review-form__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #123c32;
  font-weight: 850;
}

.review-form__body {
  display: grid;
  gap: 0.75rem;
}

.review-form__pair {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .review-form__pair {
    grid-template-columns: 1fr;
  }
}
</style>
