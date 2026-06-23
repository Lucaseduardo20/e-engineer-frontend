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
  maxListHeight?: number
}>(), {
  label: 'Tags tecnicas',
  placeholder: 'Busque tags tecnicas...',
  hint: 'Use tags tecnicas para conectar este conhecimento a projetos e recomendacoes futuras.',
  allowedStatuses: () => ['active', 'pending_review', 'deprecated'],
  allowCreate: false,
  maxTags: 20,
  maxListHeight: 320,
})

const emit = defineEmits<{ 'update:modelValue': [string[]]; created: [TechnicalTag] }>()
const auth = useAuthStore()

const allTags = ref<TechnicalTag[]>([])
const selected = ref<TechnicalTag[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const query = ref('')
const page = ref(1)
const pageSize = 50
const total = ref(0)
let searchTimeout: ReturnType<typeof setTimeout> | undefined
const createDialog = ref(false)
const createForm = ref<{ name: string; category: TechnicalTagCategory; description: string }>({
  name: '',
  category: 'knowledge_purpose',
  description: '',
})

const canCreate = computed(() => props.allowCreate && auth.can('knowledge.update'))
const hasMore = computed(() => allTags.value.length < total.value)
const listStyle = computed(() => ({ maxHeight: `${props.maxListHeight}px` }))

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
    syncSelected(ids ?? [])
  },
  { immediate: true },
)

watch(
  allTags,
  () => {
    syncSelected(props.modelValue ?? [])
  },
  { immediate: true },
)

watch(query, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    void loadTags({ reset: true })
  }, 250)
})

void loadTags({ reset: true })

async function loadTags(options: { reset?: boolean } = {}) {
  loading.value = true
  error.value = null
  if (options.reset) {
    page.value = 1
  }

  try {
    const response = await apiClient.technicalTags.list({
      includeArchived: false,
      limit: pageSize,
      page: page.value,
      search: query.value.trim() || undefined,
    })
    total.value = response.total
    allTags.value = options.reset ? response.items : [...allTags.value, ...response.items]
  } catch {
    error.value = 'Nao foi possivel carregar tags tecnicas.'
  } finally {
    loading.value = false
  }
}

function syncSelected(ids: string[]) {
  if (!ids.length) {
    selected.value = []
    return
  }

  const current = new Map(selected.value.map((tag) => [tag.id, tag]))
  const loaded = new Map(allTags.value.map((tag) => [tag.id, tag]))
  selected.value = ids
    .map((id) => loaded.get(id) ?? current.get(id))
    .filter((tag): tag is TechnicalTag => Boolean(tag))
}

async function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  await loadTags()
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
  total.value += 1
  emit('created', created)
  toggleTag(created)
  createDialog.value = false
}
</script>

<template>
  <div class="technical-tag-selector" :style="{ '--tag-selector-max-height': `${maxListHeight}px` }">
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

    <div class="technical-tag-selector__available">
      <div class="technical-tag-selector__available-head">
        <span class="technical-tag-selector__section-label">Disponiveis</span>
        <small>{{ visibleTags.length }} de {{ total }} tag(s)</small>
      </div>

      <div
        v-if="!loading && groupedTags.length"
        class="technical-tag-selector__viewport"
        :style="listStyle"
      >
        <div class="technical-tag-selector__groups">
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
      </div>

      <v-empty-state
        v-else-if="!loading"
        headline="Nenhuma tag encontrada"
        text="Tente ajustar a busca ou criar uma nova tag tecnica."
      />

      <div class="technical-tag-selector__footer">
        <v-btn
          v-if="hasMore"
          size="small"
          variant="tonal"
          color="teal"
          :loading="loading"
          @click="loadMore"
        >
          Carregar mais tags
        </v-btn>
      </div>
    </div>

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
.technical-tag-selector {
  display: grid;
  gap: 0.75rem;
  border: 1px solid #d7e9e2;
  border-radius: 0.75rem;
  background: #fbfffd;
  padding: 0.85rem;
}

.technical-tag-selector__header {
  display: grid;
  gap: 0.2rem;
}

.technical-tag-selector__header strong {
  color: #14231f;
}

.technical-tag-selector__header small {
  color: #60716b;
}

.technical-tag-selector__section-label,
.technical-tag-selector__group-title {
  display: block;
  margin: 0.35rem 0;
  color: #143d33;
  font-size: 0.8rem;
  font-weight: 700;
}

.technical-tag-selector__selected {
  display: grid;
  gap: 0.35rem;
  border: 1px solid #cce5dd;
  border-radius: 0.6rem;
  background: #ffffff;
  padding: 0.65rem;
}

.technical-tag-selector__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.technical-tag-selector__available {
  display: grid;
  gap: 0.5rem;
  min-height: 0;
}

.technical-tag-selector__available-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.technical-tag-selector__available-head small {
  color: #60716b;
}

.technical-tag-selector__viewport {
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #d7e9e2;
  border-radius: 0.6rem;
  background: #ffffff;
  padding: 0.75rem;
  scrollbar-color: #8ccbbd #eef7f3;
  scrollbar-width: thin;
}

.technical-tag-selector__viewport::-webkit-scrollbar {
  width: 0.6rem;
}

.technical-tag-selector__viewport::-webkit-scrollbar-track {
  background: #eef7f3;
}

.technical-tag-selector__viewport::-webkit-scrollbar-thumb {
  border: 0.14rem solid #eef7f3;
  border-radius: 999px;
  background: #8ccbbd;
}

.technical-tag-selector__group + .technical-tag-selector__group {
  margin-top: 0.6rem;
}

.technical-tag-selector__footer {
  display: flex;
  justify-content: flex-end;
  min-height: 2rem;
}
</style>
