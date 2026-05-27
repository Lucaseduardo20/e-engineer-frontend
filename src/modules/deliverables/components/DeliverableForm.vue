<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CreateDeliverableRequest } from '@/shared/http/api-client'
import type { Deliverable, DeliverableType } from '@/shared/types/api-contracts'

const props = withDefaults(
  defineProps<{
    projectId: string
    deliverable?: Deliverable | null
    loading?: boolean
  }>(),
  {
    deliverable: null,
    loading: false,
  },
)

const emit = defineEmits<{
  submit: [payload: CreateDeliverableRequest]
  cancel: []
}>()

const statusOptions: Array<{ title: string; value: Deliverable['status'] }> = [
  { title: 'A produzir', value: 'todo' },
  { title: 'Em producao', value: 'in_progress' },
  { title: 'Concluido', value: 'done' },
  { title: 'Bloqueado', value: 'blocked' },
]

const typeOptions: Array<{ title: string; value: DeliverableType }> = [
  { title: 'Levantamento tecnico', value: 'technical_survey' },
  { title: 'Projeto arquitetonico', value: 'architectural_project' },
  { title: 'Projeto estrutural', value: 'structural_project' },
  { title: 'Projeto eletrico', value: 'electrical_project' },
  { title: 'Projeto hidraulico', value: 'hydraulic_project' },
  { title: 'Projeto de drenagem', value: 'drainage_project' },
  { title: 'Projeto de pavimentacao', value: 'paving_project' },
  { title: 'Projeto paisagistico', value: 'landscaping_project' },
  { title: 'Projeto de iluminacao', value: 'lighting_project' },
  { title: 'Memorial descritivo', value: 'descriptive_memorial' },
  { title: 'Orcamento', value: 'budget' },
  { title: 'Cronograma fisico-financeiro', value: 'schedule' },
  { title: 'ART/RRT', value: 'art_rrt' },
  { title: 'Relatorio fotografico', value: 'photographic_report' },
  { title: 'Relatorio tecnico', value: 'technical_report' },
  { title: 'Outro', value: 'other' },
]

const form = reactive({
  title: '',
  description: '',
  type: 'technical_report' as DeliverableType,
  status: 'todo' as Deliverable['status'],
  dueDate: '',
  assignees: [] as string[],
})

const title = computed(() => (props.deliverable ? 'Editar entregavel' : 'Novo entregavel'))
const canSubmit = computed(() => Boolean(form.title.trim() && form.type))

watch(
  () => props.deliverable,
  (deliverable) => {
    form.title = deliverable?.title ?? ''
    form.description = deliverable?.description ?? ''
    form.type = deliverable?.type ?? 'technical_report'
    form.status = deliverable?.status ?? 'todo'
    form.dueDate = deliverable?.dueDate ?? ''
    form.assignees = deliverable?.assignees ? [...deliverable.assignees] : []
  },
  { immediate: true },
)

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('submit', {
    projectId: props.projectId,
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    dueDate: form.dueDate || null,
    assignees: form.assignees.map((assignee) => assignee.trim()).filter(Boolean),
  })
}
</script>

<template>
  <v-card class="deliverable-form" variant="flat" rounded="lg">
    <v-card-title class="deliverable-form__title">
      <v-icon icon="$edit" color="teal" size="20" />
      <span>{{ title }}</span>
    </v-card-title>
    <v-divider />

    <v-form @submit.prevent="submit">
      <v-card-text class="deliverable-form__body">
        <v-text-field
          v-model="form.title"
          name="title"
          label="Titulo"
          maxlength="160"
          counter
          variant="outlined"
          :disabled="loading"
          :rules="[(value: string) => Boolean(value?.trim()) || 'Informe o titulo.']"
          autofocus
        />

        <v-textarea
          v-model="form.description"
          name="description"
          label="Descricao"
          rows="3"
          maxlength="2000"
          counter
          variant="outlined"
          :disabled="loading"
        />

        <div class="deliverable-form__grid">
          <v-select
            v-model="form.type"
            :items="typeOptions"
            label="Tipo"
            variant="outlined"
            :disabled="loading"
          />
          <v-select
            v-model="form.status"
            :items="statusOptions"
            label="Status"
            variant="outlined"
            :disabled="loading"
          />
        </div>

        <div class="deliverable-form__grid">
          <v-text-field
            v-model="form.dueDate"
            name="dueDate"
            label="Prazo"
            type="date"
            variant="outlined"
            :disabled="loading"
          />
          <v-combobox
            v-model="form.assignees"
            label="Responsaveis"
            variant="outlined"
            multiple
            chips
            closable-chips
            :disabled="loading"
          />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="emit('cancel')">Cancelar</v-btn>
        <v-btn type="submit" color="teal" :disabled="!canSubmit" :loading="loading">Salvar</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<style scoped>
.deliverable-form {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.deliverable-form__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.125rem;
}

.deliverable-form__body {
  display: grid;
  gap: 0.875rem;
}

.deliverable-form__grid {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .deliverable-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
