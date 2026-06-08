<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { z } from 'zod'
import {
  knowledgeTypeLabels,
  type CreateKnowledgeItemDto,
  type KnowledgeItem,
  type KnowledgeItemType,
} from '@/modules/knowledge-base/types/knowledge.types'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'

const props = defineProps<{
  modelValue?: KnowledgeItem | null
  loading?: boolean
  mode?: 'create' | 'edit'
  status?: 'draft' | 'published' | 'archived' | 'deprecated'
}>()

const emit = defineEmits<{
  submit: [payload: CreateKnowledgeItemDto]
  cancel: []
}>()

const formMode = computed(() => props.mode ?? 'create')

const creationTypes: KnowledgeItemType[] = [
  'technical_standard',
  'document_model',
  'project_reference',
  'lesson_learned',
  'review_checklist',
  'delivery_standard',
]

const schema = z.object({
  title: z.string().trim().min(1, 'Titulo obrigatorio').max(180),
  description: z.string().optional(),
  type: z.string().min(1, 'Tipo obrigatorio'),
  summary: z.string().optional(),
  whenToUse: z.string().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

const form = reactive({
  title: '',
  description: '',
  type: 'technical_standard' as KnowledgeItemType,
  summary: '',
  whenToUse: '',
  notes: '',
  tagIds: [] as string[],
})

const validationError = reactive({ message: '' })

const typeOptions = creationTypes.map((value) => ({ value, title: knowledgeTypeLabels[value] }))

const submitLabel = computed(() => (formMode.value === 'edit' ? 'Salvar alteracoes' : 'Criar item'))

const typeHint = computed(() => {
  if (form.type === 'technical_standard') return 'Use para registrar regras e criterios tecnicos reutilizaveis.'
  if (form.type === 'document_model') return 'Use para registrar modelos de memorial, relatorio, planilha ou cronograma.'
  if (form.type === 'project_reference') return 'Use para registrar projetos antigos que servem de base para novos projetos.'
  if (form.type === 'lesson_learned') return 'Use para registrar erros, retrabalhos e aprendizados importantes.'
  if (form.type === 'review_checklist') return 'Use para registrar conferencias tecnicas antes de aprovar ou entregar.'
  return 'Use para registrar como organizar e entregar pacotes tecnicos finais.'
})

watch(
  () => props.modelValue,
  (item) => {
    form.title = item?.title ?? ''
    form.description = item?.description ?? ''
    form.type = item?.type ?? 'technical_standard'
    form.tagIds = item?.tags.filter((tag) => typeof tag !== 'string').map((tag) => tag.id) ?? []

    const summary = item?.content?.summary
    const sections = Array.isArray(item?.content?.sections)
      ? (item?.content?.sections as Array<{ title?: string; body?: string }>)
      : []

    form.summary = typeof summary === 'string' ? summary : ''
    form.whenToUse = sections.find((section) => section.title === 'Quando usar')?.body ?? ''
    form.notes = sections.find((section) => section.title === 'Cuidados e observacoes')?.body ?? ''
  },
  { immediate: true },
)

function submit() {
  validationError.message = ''
  const parsed = schema.safeParse(form)

  if (!parsed.success) {
    validationError.message = parsed.error.issues[0]?.message ?? 'Revise os campos.'
    return
  }

  if (!form.summary.trim() && !form.description.trim()) {
    validationError.message = 'Preencha descricao ou conteudo principal para contextualizar o item.'
    return
  }

  emit('submit', {
    title: form.title,
    description: form.description || null,
    type: form.type,
    tagIds: form.tagIds,
    content: buildContent(),
  })
}

function buildContent(): Record<string, unknown> {
  return {
    summary: form.summary.trim() || null,
    sections: [
      { title: 'Quando usar', body: form.whenToUse.trim() },
      { title: 'Cuidados e observacoes', body: form.notes.trim() },
    ].filter((section) => section.body),
    checklist: [],
    metadata: {},
  }
}
</script>

<template>
  <v-form class="knowledge-form" @submit.prevent="submit">
    <v-alert type="info" variant="tonal" class="mb-3">
      <template v-if="formMode === 'create'">
        Crie um item para registrar padroes, modelos, referencias ou aprendizados reutilizaveis pela organizacao.
        Este item sera criado como rascunho.
      </template>
      <template v-else>
        Atualize este conhecimento para manter os padroes, referencias e aprendizados da organizacao confiaveis.
      </template>
    </v-alert>

    <v-alert v-if="status === 'published' && formMode === 'edit'" type="warning" variant="tonal" class="mb-3">
      Este item ja esta publicado. Alteracoes feitas aqui impactam o conhecimento oficial da organizacao.
    </v-alert>

    <v-alert v-if="status === 'deprecated' && formMode === 'edit'" type="warning" variant="outlined" class="mb-3">
      Este item esta obsoleto. Alteracoes nao tornam o item recomendado novamente.
    </v-alert>

    <v-alert v-if="validationError.message" type="warning" variant="tonal" class="mb-3">{{ validationError.message }}</v-alert>

    <v-text-field v-model="form.title" label="Titulo" variant="outlined" />
    <v-select v-model="form.type" :items="typeOptions" label="Tipo" variant="outlined" />

    <v-alert type="info" variant="outlined" density="compact" class="mb-3">{{ typeHint }}</v-alert>

    <v-textarea v-model="form.description" label="Descricao" variant="outlined" rows="3" />
    <v-textarea v-model="form.summary" label="Conteudo principal / resumo" variant="outlined" rows="3" />
    <v-textarea v-model="form.whenToUse" label="Quando usar (opcional)" variant="outlined" rows="2" />
    <v-textarea v-model="form.notes" label="Cuidados e observacoes (opcional)" variant="outlined" rows="2" />
    <TechnicalTagSelector v-model="form.tagIds" :allow-create="true" />

    <div class="knowledge-form__actions">
      <v-btn variant="text" @click="emit('cancel')">Cancelar</v-btn>
      <v-btn color="teal" type="submit" :loading="loading" prepend-icon="$success">{{ submitLabel }}</v-btn>
    </div>
  </v-form>
</template>

<style scoped>
.knowledge-form { display: grid; gap: 0.75rem; }
.knowledge-form__actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
