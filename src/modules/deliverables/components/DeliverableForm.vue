<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import { dateInputToTimestamp, toDateInputValue } from '@/shared/formatters/date.formatter'
import type { CreateDeliverableRequest } from '@/shared/http/api-client'
import type { Deliverable, DeliverableType, ProjectKnowledgeItem, User } from '@/shared/types/api-contracts'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'

const props = withDefaults(
  defineProps<{
    projectId: string
    deliverable?: Deliverable | null
    knowledgeItems?: ProjectKnowledgeItem[]
    loading?: boolean
  }>(),
  {
    deliverable: null,
    knowledgeItems: () => [],
    loading: false,
  },
)

const emit = defineEmits<{
  submit: [payload: CreateDeliverableRequest & { knowledgeItemIds?: string[] }]
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
  tagIds: [] as string[],
  knowledgeItemIds: [] as string[],
})
const step = ref(1)
const users = ref<User[]>([])
const isLoadingUsers = ref(false)
const usersError = ref<string | null>(null)

const title = computed(() => (props.deliverable ? 'Editar entregavel' : 'Novo entregavel'))
const canSubmit = computed(() => Boolean(form.title.trim() && form.type))
const stepItems = [
  { value: 1, title: 'Base', text: 'Nome, prazo e responsável' },
  { value: 2, title: 'Inteligência', text: 'Tags e conhecimentos' },
]
const assigneeOptions = computed(() =>
  users.value.map((user) => ({
    title: `${user.fullName} (${user.email})`,
    value: user.id,
  })),
)
const knowledgeOptions = computed(() =>
  props.knowledgeItems.map((entry) => ({
    title: entry.knowledgeItem.title,
    value: entry.knowledgeItem.id,
    subtitle: entry.targetType === 'deliverable' ? 'Ligado a entregável' : 'Conhecimento do projeto',
  })),
)

onMounted(() => {
  void loadUsers()
})

watch(
  () => props.deliverable,
  (deliverable) => {
    form.title = deliverable?.title ?? ''
    form.description = deliverable?.description ?? ''
    form.type = deliverable?.type ?? 'technical_report'
    form.status = deliverable?.status ?? 'todo'
    form.dueDate = toDateInputValue(deliverable?.dueDate)
    form.assignees = deliverable?.assignees ? [...deliverable.assignees] : []
    form.tagIds = deliverable?.tagIds ? [...deliverable.tagIds] : []
    form.knowledgeItemIds = deliverable
      ? props.knowledgeItems
          .filter((entry) => entry.targetType === 'deliverable' && entry.targetId === deliverable.id)
          .map((entry) => entry.knowledgeItem.id)
      : []
    step.value = 1
  },
  { immediate: true },
)

async function loadUsers() {
  isLoadingUsers.value = true
  usersError.value = null

  try {
    users.value = await apiClient.organizations.users()
  } catch (error) {
    users.value = []
    usersError.value = getApiErrorMessage(error, 'Nao foi possivel carregar responsaveis.')
  } finally {
    isLoadingUsers.value = false
  }
}

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
    dueDate: dateInputToTimestamp(form.dueDate),
    assignees: form.assignees.map((assignee) => assignee.trim()).filter(Boolean),
    tagIds: form.tagIds,
    knowledgeItemIds: form.knowledgeItemIds,
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
        <div class="deliverable-form__steps">
          <button
            v-for="item in stepItems"
            :key="item.value"
            type="button"
            class="deliverable-form__step"
            :class="{ 'deliverable-form__step--active': step === item.value }"
            @click="step = item.value"
          >
            <strong>{{ item.value }}</strong>
            <span>{{ item.title }}</span>
            <small>{{ item.text }}</small>
          </button>
        </div>

        <div v-if="step === 1" class="deliverable-form__panel">
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
            <v-select
              v-model="form.assignees"
              :items="assigneeOptions"
              label="Responsaveis"
              variant="outlined"
              multiple
              chips
              closable-chips
              :loading="isLoadingUsers"
              :disabled="loading || isLoadingUsers"
              :error-messages="usersError ? [usersError] : []"
            />
          </div>
        </div>

        <div v-else class="deliverable-form__panel deliverable-form__panel--intelligence">
          <v-sheet border rounded="lg" class="deliverable-form__intelligence-hero">
            <div>
              <span>Inteligência aplicada</span>
              <h3>Tags e conhecimentos formam o raciocínio deste entregável</h3>
              <p>
                Use esta etapa para criar tracing técnico, alimentar recomendações e conectar o entregável
                ao conhecimento reutilizável da plataforma.
              </p>
            </div>
            <v-chip color="teal" variant="flat">{{ form.tagIds.length }} tag(s)</v-chip>
          </v-sheet>

          <TechnicalTagSelector
            v-model="form.tagIds"
            :allow-create="false"
            :max-list-height="300"
            :categories="['technical_discipline','document_type','operational_pain','project_stage','knowledge_purpose']"
            :allowed-statuses="['active','pending_review','deprecated']"
          />

          <v-select
            v-model="form.knowledgeItemIds"
            :items="knowledgeOptions"
            item-title="title"
            item-value="value"
            label="Conhecimentos relacionados"
            variant="outlined"
            multiple
            chips
            closable-chips
            no-data-text="Aplique ou crie conhecimentos no projeto para relacionar aqui."
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="item.subtitle" />
            </template>
          </v-select>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="emit('cancel')">Cancelar</v-btn>
        <v-btn v-if="step === 1" color="teal" variant="tonal" :disabled="!canSubmit" @click="step = 2">
          Avancar para inteligência
        </v-btn>
        <v-btn v-else type="submit" color="teal" :disabled="!canSubmit" :loading="loading">Salvar</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<style scoped>
.deliverable-form {
  border: 1px solid #d7e4df;
  background:
    linear-gradient(180deg, #ffffff, #f8fcfa),
    #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.deliverable-form :deep(.v-field) {
  background: #ffffff;
  color: #14231f;
}

.deliverable-form :deep(.v-field__outline) {
  color: #9bb9b1;
}

.deliverable-form :deep(.v-label),
.deliverable-form :deep(.v-field__input) {
  color: #263b35;
}

.deliverable-form :deep(.v-field--focused .v-field__outline) {
  color: #267365;
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

.deliverable-form__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.deliverable-form__step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.15rem 0.65rem;
  border: 1px solid #d7e4df;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 0.8rem;
  text-align: left;
}

.deliverable-form__step strong {
  display: grid;
  grid-row: span 2;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 999px;
  background: #d7f2e7;
  color: #143d33;
}

.deliverable-form__step span {
  color: #14231f;
  font-weight: 850;
}

.deliverable-form__step small {
  color: #60716b;
}

.deliverable-form__step--active {
  border-color: #267365;
  background: #f0fbf7;
}

.deliverable-form__panel {
  display: grid;
  gap: 0.875rem;
}

.deliverable-form__panel--intelligence {
  border: 1px solid #b9ddd2;
  border-radius: 1rem;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.13), transparent 18rem),
    linear-gradient(180deg, #f0fbf7, #ffffff 42%);
  padding: 1rem;
}

.deliverable-form__intelligence-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-color: #9bd9cb;
  background:
    linear-gradient(135deg, #10342d, #146052 58%, #e8fbf4),
    #10342d;
  padding: 1rem;
}

.deliverable-form__intelligence-hero > div {
  display: grid;
  gap: 0.25rem;
}

.deliverable-form__intelligence-hero span {
  color: #a9f3de;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.deliverable-form__intelligence-hero h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.15rem;
  line-height: 1.2;
}

.deliverable-form__intelligence-hero p {
  margin: 0;
  color: rgb(255 255 255 / 0.82);
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
