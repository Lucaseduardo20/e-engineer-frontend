<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { apiClient } from '@/shared/http/api-client'
import type { TechnicalTag, TechnicalTagCategory, TechnicalTagStatus } from '@/shared/types/api-contracts'
import { TECHNICAL_TAG_CATEGORY_LABELS, TECHNICAL_TAG_STATUS_LABELS } from '@/modules/technical-taxonomy/types/technical-tags'

const props = withDefaults(defineProps<{
  modelValue: string[]
  label?: string
  placeholder?: string
  hint?: string
  categories?: TechnicalTagCategory[]
  allowedStatuses?: TechnicalTagStatus[]
  disabled?: boolean
  readonly?: boolean
  allowCreate?: boolean
  maxTags?: number
}>(), {
  label: 'Tags tecnicas',
  placeholder: 'Busque tags tecnicas...',
  hint: 'Use tags tecnicas para conectar este conhecimento a projetos e recomendacoes futuras.',
  allowedStatuses: () => ['active', 'pending_review', 'deprecated'],
  allowCreate: false,
  maxTags: 20,
})

const emit = defineEmits<{ 'update:modelValue': [string[]]; created: [TechnicalTag] }>()
const auth = useAuthStore()

const allTags = ref<TechnicalTag[]>([])
const selected = ref<TechnicalTag[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const query = ref('')
const createDialog = ref(false)
const createForm = ref<{ name: string; category: TechnicalTagCategory; description: string }>({
  name: '',
  category: 'knowledge_purpose',
  description: '',
})

const canCreate = computed(() => props.allowCreate && auth.can('knowledge.update'))

const categoryOptions = Object.entries(TECHNICAL_TAG_CATEGORY_LABELS).map(([value, title]) => ({ value, title }))

const visibleTags = computed(() => {
  const text = query.value.trim().toLowerCase()
  return allTags.value.filter((tag) => {
    if (props.categories?.length && !props.categories.includes(tag.category)) return false
    if (!props.allowedStatuses.includes(tag.status)) return false
    if (tag.status === 'archived') return false
    if (!text) return true
    return `${tag.name} ${tag.slug} ${TECHNICAL_TAG_CATEGORY_LABELS[tag.category]}`.toLowerCase().includes(text)
  })
})

const groupedTags = computed(() => {
  const groups = new Map<TechnicalTagCategory, TechnicalTag[]>()
  for (const tag of visibleTags.value) {
    const list = groups.get(tag.category) ?? []
    list.push(tag)
    groups.set(tag.category, list)
  }
  return [...groups.entries()]
})

watch(
  () => props.modelValue,
  (ids) => {
    if (!ids?.length) {
      selected.value = []
      return
    }
    const set = new Set(ids)
    selected.value = allTags.value.filter((tag) => set.has(tag.id))
  },
  { immediate: true },
)

watch(
  allTags,
  () => {
    if (!props.modelValue?.length) return
    const set = new Set(props.modelValue)
    selected.value = allTags.value.filter((tag) => set.has(tag.id))
  },
  { immediate: true },
)

void loadTags()

async function loadTags() {
  loading.value = true
  error.value = null
  try {
    const response = await apiClient.technicalTags.list({ includeArchived: false, limit: 100 })
    allTags.value = response.items
  } catch {
    error.value = 'Nao foi possivel carregar tags tecnicas.'
  } finally {
    loading.value = false
  }
}

function isSelected(tagId: string) {
  return selected.value.some((tag) => tag.id === tagId)
}

function toggleTag(tag: TechnicalTag) {
  if (props.disabled || props.readonly) return
  if (tag.status === 'archived') return

  const exists = isSelected(tag.id)
  const next = exists
    ? selected.value.filter((item) => item.id !== tag.id)
    : [...selected.value, tag]

  const unique = [...new Map(next.map((item) => [item.id, item])).values()].slice(0, props.maxTags)
  selected.value = unique
  emit('update:modelValue', unique.map((item) => item.id))
}

function statusColor(status: TechnicalTagStatus) {
  if (status === 'deprecated') return 'warning'
  if (status === 'pending_review') return 'blue-grey'
  return 'teal'
}

async function quickCreate() {
  if (!createForm.value.name.trim()) return
  const created = await apiClient.technicalTags.create({
    name: createForm.value.name.trim(),
    category: createForm.value.category,
    description: createForm.value.description.trim() || undefined,
  })
  allTags.value = [created, ...allTags.value]
  emit('created', created)
  toggleTag(created)
  createDialog.value = false
}
</script>

<template>
  <div class="technical-tag-selector">
    <div class="technical-tag-selector__header">
      <strong>{{ label }}</strong>
      <small>{{ hint }}</small>
    </div>

    <v-text-field
      v-model="query"
      :placeholder="placeholder"
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="$search"
      hide-details
      class="mb-3"
      :disabled="disabled || readonly"
    />

    <v-alert v-if="error" type="error" variant="tonal" class="mb-2">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate color="teal" class="mb-2" />

    <div class="technical-tag-selector__selected" v-if="selected.length">
      <span class="technical-tag-selector__section-label">Selecionadas</span>
      <div class="technical-tag-selector__chips">
        <v-chip
          v-for="tag in selected"
          :key="tag.id"
          :color="statusColor(tag.status)"
          variant="tonal"
          :closable="!disabled && !readonly"
          @click:close="toggleTag(tag)"
        >
          {{ tag.name }}
        </v-chip>
      </div>
    </div>

    <div v-if="!loading && groupedTags.length" class="technical-tag-selector__groups">
      <div v-for="[category, tags] in groupedTags" :key="category" class="technical-tag-selector__group">
        <div class="technical-tag-selector__group-title">{{ TECHNICAL_TAG_CATEGORY_LABELS[category] }}</div>
        <div class="technical-tag-selector__chips">
          <v-chip
            v-for="tag in tags"
            :key="tag.id"
            :color="isSelected(tag.id) ? 'teal' : statusColor(tag.status)"
            :variant="isSelected(tag.id) ? 'flat' : 'tonal'"
            @click="toggleTag(tag)"
          >
            {{ tag.name }}
            <span v-if="tag.status !== 'active'" class="ml-1">({{ TECHNICAL_TAG_STATUS_LABELS[tag.status] }})</span>
          </v-chip>
        </div>
      </div>
    </div>

    <v-empty-state
      v-else-if="!loading"
      headline="Nenhuma tag encontrada"
      text="Tente ajustar a busca ou criar uma nova tag tecnica."
    />

    <v-btn
      v-if="canCreate"
      class="mt-2"
      size="small"
      variant="tonal"
      color="teal"
      prepend-icon="$plus"
      @click="createDialog = true"
    >
      Criar nova tag
    </v-btn>

    <v-dialog v-model="createDialog" max-width="560">
      <v-card>
        <v-card-title>Criar nova tag tecnica</v-card-title>
        <v-card-text>
          <v-text-field v-model="createForm.name" label="Nome" variant="outlined" />
          <v-select
            v-model="createForm.category"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            label="Categoria"
            variant="outlined"
          />
          <v-textarea v-model="createForm.description" label="Descricao" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Cancelar</v-btn>
          <v-btn color="teal" @click="quickCreate">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.technical-tag-selector__header {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}

.technical-tag-selector__header small {
  color: #667085;
}

.technical-tag-selector__section-label,
.technical-tag-selector__group-title {
  display: block;
  margin: 0.35rem 0;
  color: #344054;
  font-size: 0.8rem;
  font-weight: 700;
}

.technical-tag-selector__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.technical-tag-selector__group + .technical-tag-selector__group {
  margin-top: 0.6rem;
}
</style>
