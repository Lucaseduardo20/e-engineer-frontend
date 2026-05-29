<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { z } from 'zod'
import {
  knowledgeTypeLabels,
  type CreateKnowledgeItemDto,
  type KnowledgeItem,
  type KnowledgeItemType,
} from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{
  modelValue?: KnowledgeItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreateKnowledgeItemDto]
  cancel: []
}>()

const schema = z.object({
  title: z.string().trim().min(1, 'Titulo obrigatorio').max(180),
  description: z.string().optional(),
  type: z.string().min(1),
  tagsText: z.string().optional(),
  contentText: z.string().optional(),
})

const form = reactive({
  title: '',
  description: '',
  type: 'technical_standard' as KnowledgeItemType,
  tagsText: '',
  contentText: '',
})
const validationError = reactive({ message: '' })

const typeOptions = Object.entries(knowledgeTypeLabels).map(([value, title]) => ({ value, title }))
const typeHint = computed(() => {
  if (form.type === 'lesson_learned') return 'Registre problema, impacto e recomendacao.'
  if (form.type === 'project_reference') return 'Inclua motivo da referencia, alertas e reutilizaveis.'
  if (form.type === 'review_checklist') return 'Inclua itens de checklist e criterios de aprovacao.'
  if (form.type === 'document_model') return 'Inclua instrucoes de uso e referencia ao arquivo.'
  return 'Use JSON simples para os campos especificos deste tipo.'
})

watch(
  () => props.modelValue,
  (item) => {
    form.title = item?.title ?? ''
    form.description = item?.description ?? ''
    form.type = item?.type ?? 'technical_standard'
    form.tagsText = item?.tags.join(', ') ?? ''
    form.contentText = item?.content ? JSON.stringify(item.content, null, 2) : ''
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

  const content = parseContent()

  if (content === false) {
    validationError.message = 'Conteudo especifico precisa ser um JSON valido.'
    return
  }

  emit('submit', {
    title: form.title,
    description: form.description || null,
    type: form.type,
    tags: form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    content,
  })
}

function parseContent(): Record<string, unknown> | null | false {
  if (!form.contentText.trim()) return null

  try {
    const value = JSON.parse(form.contentText)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : false
  } catch {
    return false
  }
}
</script>

<template>
  <v-form class="knowledge-form" @submit.prevent="submit">
    <v-alert v-if="validationError.message" type="warning" variant="tonal" class="mb-3">
      {{ validationError.message }}
    </v-alert>
    <v-text-field v-model="form.title" label="Titulo" variant="outlined" />
    <v-textarea v-model="form.description" label="Descricao" variant="outlined" rows="3" />
    <v-select v-model="form.type" :items="typeOptions" label="Tipo" variant="outlined" />
    <v-text-field v-model="form.tagsText" label="Tags separadas por virgula" variant="outlined" />
    <v-textarea
      v-model="form.contentText"
      :label="`Conteudo especifico - ${typeHint}`"
      variant="outlined"
      rows="8"
      auto-grow
    />
    <div class="knowledge-form__actions">
      <v-btn variant="text" @click="emit('cancel')">Cancelar</v-btn>
      <v-btn color="teal" type="submit" :loading="loading" prepend-icon="$success">
        Salvar
      </v-btn>
    </div>
  </v-form>
</template>

<style scoped>
.knowledge-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
