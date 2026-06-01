<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useTechnicalTagsStore } from '@/modules/technical-tags/stores/technical-tags.store'
import type { TechnicalTag, TechnicalTagCategory, TechnicalTagStatus } from '@/shared/types/api-contracts'

const auth = useAuthStore()
const store = useTechnicalTagsStore()

const filters = reactive<{ search: string; category?: TechnicalTagCategory; status?: TechnicalTagStatus; includeArchived: boolean }>({ search: '', includeArchived: false })
const dialogOpen = ref(false)
const editing = ref<TechnicalTag | null>(null)
const form = reactive<{ name: string; category: TechnicalTagCategory; description: string }>({ name: '', category: 'project_type', description: '' })

const categoryOptions = [
  { value: 'project_type', title: 'Tipo de projeto' },
  { value: 'technical_discipline', title: 'Disciplina tecnica' },
  { value: 'document_type', title: 'Tipo de documento' },
  { value: 'operational_pain', title: 'Dor operacional' },
  { value: 'client_context', title: 'Contexto cliente/orgao' },
  { value: 'project_stage', title: 'Etapa do projeto' },
  { value: 'knowledge_purpose', title: 'Finalidade do conhecimento' },
]

const statusOptions = [
  { value: 'active', title: 'Ativa' },
  { value: 'pending_review', title: 'Pendente revisao' },
  { value: 'deprecated', title: 'Obsoleta' },
  { value: 'archived', title: 'Arquivada' },
]

onMounted(() => { void load() })

async function load(page = 1) {
  await store.load({ page, pageSize: store.pageSize, ...filters })
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.category = 'project_type'
  form.description = ''
  dialogOpen.value = true
}

function openEdit(item: TechnicalTag) {
  editing.value = item
  form.name = item.name
  form.category = item.category
  form.description = item.description ?? ''
  dialogOpen.value = true
}

async function submit() {
  if (!form.name.trim()) return
  if (editing.value) {
    await store.update(editing.value.id, { name: form.name, category: form.category, description: form.description || undefined })
  } else {
    await store.create({ name: form.name, category: form.category, description: form.description || undefined })
  }
  if (!store.error) dialogOpen.value = false
}
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h2>Taxonomia tecnica</h2>
        <p>Gerencie tags tecnicas governadas por organizacao.</p>
      </div>
      <v-btn v-if="auth.can('knowledge.update')" color="teal" prepend-icon="$plus" @click="openCreate">Nova tag</v-btn>
    </div>

    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-3">{{ store.error }}</v-alert>

    <v-sheet border rounded="lg" class="pa-3 mb-3">
      <div class="d-grid" style="grid-template-columns:2fr 1fr 1fr auto auto; gap:12px;">
        <v-text-field v-model="filters.search" label="Buscar" hide-details clearable variant="outlined" density="comfortable" />
        <v-select v-model="filters.category" :items="categoryOptions" item-title="title" item-value="value" label="Categoria" hide-details clearable variant="outlined" density="comfortable" />
        <v-select v-model="filters.status" :items="statusOptions" item-title="title" item-value="value" label="Status" hide-details clearable variant="outlined" density="comfortable" />
        <v-checkbox v-model="filters.includeArchived" label="Incluir arquivadas" hide-details />
        <v-btn color="teal" :loading="store.isLoading" @click="load(1)">Filtrar</v-btn>
      </div>
    </v-sheet>

    <v-table>
      <thead><tr><th>Nome</th><th>Slug</th><th>Categoria</th><th>Status</th><th>Acoes</th></tr></thead>
      <tbody>
        <tr v-for="item in store.items" :key="item.id">
          <td>{{ item.name }}</td><td>{{ item.slug }}</td><td>{{ item.category }}</td><td>{{ item.status }}</td>
          <td>
            <v-btn size="small" variant="text" @click="openEdit(item)" v-if="auth.can('knowledge.update')">Editar</v-btn>
            <v-btn size="small" variant="text" color="warning" @click="store.deprecate(item.id)" v-if="auth.can('knowledge.deprecate') && item.status==='active'">Obsoleta</v-btn>
            <v-btn size="small" variant="text" color="error" @click="store.archive(item.id)" v-if="auth.can('knowledge.archive') && item.status!=='archived'">Arquivar</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-pagination :model-value="store.page" :length="Math.max(1, Math.ceil(store.total / store.pageSize))" class="mt-3" @update:model-value="load" />

    <v-dialog v-model="dialogOpen" max-width="680">
      <v-card>
        <v-card-title>{{ editing ? 'Editar tag' : 'Nova tag tecnica' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <v-select v-model="form.category" :items="categoryOptions" item-title="title" item-value="value" label="Categoria" variant="outlined" />
          <v-textarea v-model="form.description" label="Descricao" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancelar</v-btn>
          <v-btn color="teal" :loading="store.isSaving" @click="submit">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
