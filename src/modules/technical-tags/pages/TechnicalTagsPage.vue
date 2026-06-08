<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useTechnicalTagsStore } from '@/modules/technical-tags/stores/technical-tags.store'
import {
  TECHNICAL_TAG_CATEGORY_LABELS,
  TECHNICAL_TAG_STATUS_LABELS,
} from '@/modules/technical-taxonomy/types/technical-tags'
import { permissions } from '@/shared/auth/rbac'
import type { TechnicalTag, TechnicalTagCategory, TechnicalTagStatus } from '@/shared/types/api-contracts'

const auth = useAuthStore()
const store = useTechnicalTagsStore()

const filters = reactive<{
  search: string
  category?: TechnicalTagCategory
  status?: TechnicalTagStatus
  includeArchived: boolean
}>({
  search: '',
  includeArchived: false,
})
const dialogOpen = ref(false)
const confirmDialogOpen = ref(false)
const editing = ref<TechnicalTag | null>(null)
const pendingAction = ref<{ type: 'archive' | 'deprecate'; tag: TechnicalTag } | null>(null)
const form = reactive<{ name: string; category: TechnicalTagCategory; description: string }>({
  name: '',
  category: 'project_type',
  description: '',
})

const categoryOptions = Object.entries(TECHNICAL_TAG_CATEGORY_LABELS).map(([value, title]) => ({
  value,
  title,
}))

const statusOptions = Object.entries(TECHNICAL_TAG_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}))

const canManageTags = computed(() => auth.can(permissions.knowledge.update))
const canArchiveTags = computed(() => auth.can(permissions.knowledge.archive))
const canDeprecateTags = computed(() => auth.can(permissions.knowledge.deprecate))
const canShowActions = computed(
  () => canManageTags.value || canArchiveTags.value || canDeprecateTags.value,
)
const totalPages = computed(() => Math.max(1, Math.ceil(store.total / store.pageSize)))
const confirmTitle = computed(() =>
  pendingAction.value?.type === 'archive' ? 'Arquivar tag' : 'Marcar tag como obsoleta',
)
const confirmText = computed(() => {
  if (!pendingAction.value) return ''

  if (pendingAction.value.type === 'archive') {
    return `A tag "${pendingAction.value.tag.name}" deixara de aparecer nos fluxos ativos. O historico e os vinculos existentes serao preservados.`
  }

  return `A tag "${pendingAction.value.tag.name}" continuara visivel como referencia, mas indicada como obsoleta para novos usos.`
})

onMounted(() => {
  void load()
})

function categoryLabel(category: TechnicalTagCategory) {
  return TECHNICAL_TAG_CATEGORY_LABELS[category] ?? category
}

function statusLabel(status: TechnicalTagStatus) {
  return TECHNICAL_TAG_STATUS_LABELS[status] ?? status
}

function statusColor(status: TechnicalTagStatus) {
  const colors: Record<TechnicalTagStatus, string> = {
    active: 'success',
    pending_review: 'warning',
    deprecated: 'grey',
    archived: 'error',
  }

  return colors[status]
}

async function load(page = 1) {
  await store.load({
    page,
    pageSize: store.pageSize,
    search: filters.search || undefined,
    category: filters.category,
    status: filters.status,
    includeArchived: filters.includeArchived,
  })
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    name: '',
    category: 'project_type',
    description: '',
  })
  dialogOpen.value = true
}

function openEdit(item: TechnicalTag) {
  editing.value = item
  Object.assign(form, {
    name: item.name,
    category: item.category,
    description: item.description ?? '',
  })
  dialogOpen.value = true
}

function requestAction(type: 'archive' | 'deprecate', tag: TechnicalTag) {
  pendingAction.value = { type, tag }
  confirmDialogOpen.value = true
}

async function submit() {
  if (!form.name.trim()) return

  if (editing.value) {
    await store.update(editing.value.id, {
      name: form.name,
      category: form.category,
      description: form.description || undefined,
    })
  } else {
    await store.create({
      name: form.name,
      category: form.category,
      description: form.description || undefined,
    })
  }

  if (!store.error) dialogOpen.value = false
}

async function confirmAction() {
  if (!pendingAction.value) return

  if (pendingAction.value.type === 'archive') {
    await store.archive(pendingAction.value.tag.id)
  } else {
    await store.deprecate(pendingAction.value.tag.id)
  }

  if (!store.error) {
    confirmDialogOpen.value = false
    pendingAction.value = null
  }
}
</script>

<template>
  <main class="technical-tags-page">
    <section class="technical-tags-page__header">
      <div>
        <span class="technical-tags-page__eyebrow">Organizacao</span>
        <h1>Tags</h1>
        <p>
          Tags ajudam a organizar o conhecimento tecnico e melhoram recomendacoes entre
          projetos, documentos, revisoes e referencias reutilizaveis.
        </p>
      </div>
      <div class="technical-tags-page__header-actions">
        <v-chip v-if="!canManageTags" color="grey" variant="tonal">Somente leitura</v-chip>
        <v-btn v-if="canManageTags" color="teal" prepend-icon="$plus" @click="openCreate">
          Nova tag
        </v-btn>
      </div>
    </section>

    <v-alert v-if="store.error" type="error" variant="tonal">{{ store.error }}</v-alert>

    <v-sheet border rounded="lg" class="technical-tags-page__filters">
      <v-text-field
        v-model="filters.search"
        label="Buscar tag"
        hide-details
        clearable
        variant="outlined"
        density="comfortable"
        @keyup.enter="load(1)"
      />
      <v-select
        v-model="filters.category"
        :items="categoryOptions"
        item-title="title"
        item-value="value"
        label="Categoria"
        hide-details
        clearable
        variant="outlined"
        density="comfortable"
      />
      <v-select
        v-model="filters.status"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        label="Status"
        hide-details
        clearable
        variant="outlined"
        density="comfortable"
      />
      <v-checkbox
        v-model="filters.includeArchived"
        label="Incluir arquivadas"
        hide-details
        density="comfortable"
      />
      <v-btn color="teal" variant="tonal" :loading="store.isLoading" @click="load(1)">
        Filtrar
      </v-btn>
    </v-sheet>

    <v-sheet border rounded="lg" class="technical-tags-page__table">
      <v-table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Slug</th>
            <th>Categoria</th>
            <th>Status</th>
            <th>Descricao</th>
            <th class="text-right">Uso</th>
            <th v-if="canShowActions" class="text-right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in store.items" :key="item.id">
            <td>
              <strong>{{ item.name }}</strong>
            </td>
            <td>
              <code>{{ item.slug }}</code>
            </td>
            <td>{{ categoryLabel(item.category) }}</td>
            <td>
              <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
                {{ statusLabel(item.status) }}
              </v-chip>
            </td>
            <td class="technical-tags-page__description">
              {{ item.description || 'Sem descricao' }}
            </td>
            <td class="text-right">{{ item.usageCount ?? 0 }}</td>
            <td v-if="canShowActions" class="text-right">
              <div class="technical-tags-page__actions">
                <v-btn
                  v-if="canManageTags"
                  size="small"
                  variant="text"
                  color="teal"
                  @click="openEdit(item)"
                >
                  Editar
                </v-btn>
                <v-btn
                  v-if="canDeprecateTags && item.status === 'active'"
                  size="small"
                  variant="text"
                  color="warning"
                  @click="requestAction('deprecate', item)"
                >
                  Depreciar
                </v-btn>
                <v-btn
                  v-if="canArchiveTags && item.status !== 'archived'"
                  size="small"
                  variant="text"
                  color="error"
                  @click="requestAction('archive', item)"
                >
                  Arquivar
                </v-btn>
              </div>
            </td>
          </tr>
          <tr v-if="!store.isLoading && store.items.length === 0">
            <td :colspan="canShowActions ? 7 : 6">
              <div class="technical-tags-page__empty">
                <strong>Nenhuma tag encontrada</strong>
                <span>Ajuste os filtros ou cadastre uma tag para organizar o acervo tecnico.</span>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-progress-linear v-if="store.isLoading" indeterminate color="teal" />
    </v-sheet>

    <v-pagination
      :model-value="store.page"
      :length="totalPages"
      class="technical-tags-page__pagination"
      @update:model-value="load"
    />

    <v-dialog v-model="dialogOpen" max-width="680">
      <v-card>
        <v-card-title>{{ editing ? 'Editar tag' : 'Nova tag' }}</v-card-title>
        <v-card-text class="technical-tags-page__form">
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <v-select
            v-model="form.category"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            label="Categoria"
            variant="outlined"
          />
          <v-textarea v-model="form.description" label="Descricao" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancelar</v-btn>
          <v-btn color="teal" :loading="store.isSaving" @click="submit">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialogOpen" max-width="520">
      <v-card>
        <v-card-title>{{ confirmTitle }}</v-card-title>
        <v-card-text>{{ confirmText }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialogOpen = false">Cancelar</v-btn>
          <v-btn
            :color="pendingAction?.type === 'archive' ? 'error' : 'warning'"
            :loading="store.isSaving"
            @click="confirmAction"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.technical-tags-page {
  display: grid;
  gap: 1rem;
}

.technical-tags-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.technical-tags-page__header h1 {
  margin: 0.15rem 0 0.35rem;
  color: #15231f;
  font-size: 2rem;
}

.technical-tags-page__header p {
  max-width: 48rem;
  margin: 0;
  color: #596963;
}

.technical-tags-page__eyebrow {
  color: #267365;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.technical-tags-page__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.technical-tags-page__filters {
  display: grid;
  grid-template-columns: minmax(16rem, 2fr) minmax(12rem, 1fr) minmax(12rem, 1fr) auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
}

.technical-tags-page__table {
  overflow: hidden;
}

.technical-tags-page__description {
  max-width: 28rem;
  color: #596963;
}

.technical-tags-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.technical-tags-page__empty {
  display: grid;
  gap: 0.25rem;
  padding: 2rem;
  color: #596963;
  text-align: center;
}

.technical-tags-page__empty strong {
  color: #15231f;
}

.technical-tags-page__pagination {
  justify-self: center;
}

.technical-tags-page__form {
  display: grid;
  gap: 0.75rem;
}

code {
  color: #35524a;
  font-size: 0.85rem;
}

@media (max-width: 960px) {
  .technical-tags-page__header {
    display: grid;
  }

  .technical-tags-page__filters {
    grid-template-columns: 1fr;
  }
}
</style>
