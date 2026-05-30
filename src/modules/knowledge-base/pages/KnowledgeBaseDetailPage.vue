<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KnowledgeDetailsPanel from '@/modules/knowledge-base/components/KnowledgeDetailsPanel.vue'
import KnowledgeItemForm from '@/modules/knowledge-base/components/KnowledgeItemForm.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import type { CreateKnowledgeItemDto } from '@/modules/knowledge-base/types/knowledge.types'

const route = useRoute()
const router = useRouter()
const store = useKnowledgeItemsStore()
const showEdit = ref(false)
const showConfirm = ref(false)
const pendingAction = ref<'publish' | 'archive' | 'deprecate' | null>(null)
const successMessage = ref('')

const itemId = computed(() => String(route.params.id))

onMounted(() => {
  void store.getItemDetail(itemId.value)
})

const isNotFound = computed(() => !store.isLoading && !store.selectedItem && !store.error)
const isArchived = computed(() => store.selectedItem?.status === 'archived')

const confirmTitle = computed(() => {
  if (pendingAction.value === 'publish') return 'Publicar item de conhecimento?'
  if (pendingAction.value === 'archive') return 'Arquivar item de conhecimento?'
  return 'Marcar item como obsoleto?'
})

const confirmText = computed(() => {
  if (pendingAction.value === 'publish') {
    return 'Depois de publicado, este item sera considerado conhecimento oficial da organizacao.'
  }

  if (pendingAction.value === 'archive') {
    return 'Itens arquivados nao aparecem por padrao na Base de Conhecimento, mas continuam acessiveis como historico.'
  }

  return 'O item continuara disponivel como historico, mas nao devera ser usado como referencia para novos projetos.'
})

function openEdit() {
  if (isArchived.value) return
  showEdit.value = true
}

function askAction(action: 'publish' | 'archive' | 'deprecate') {
  pendingAction.value = action
  showConfirm.value = true
}

async function confirmAction() {
  if (!pendingAction.value) return

  const action = pendingAction.value
  let updated = null

  if (action === 'publish') updated = await store.publishItem(itemId.value)
  if (action === 'archive') updated = await store.archiveItem(itemId.value)
  if (action === 'deprecate') updated = await store.deprecateItem(itemId.value)

  if (updated) {
    successMessage.value =
      action === 'publish'
        ? 'Item publicado com sucesso.'
        : action === 'archive'
          ? 'Item arquivado com sucesso.'
          : 'Item marcado como obsoleto.'
  }

  showConfirm.value = false
  pendingAction.value = null
}

async function saveEdit(payload: CreateKnowledgeItemDto) {
  const updated = await store.updateItem(itemId.value, payload)

  if (updated) {
    successMessage.value = 'Item de conhecimento atualizado com sucesso.'
    showEdit.value = false
  }
}
</script>

<template>
  <main class="knowledge-detail-page">
    <div class="knowledge-detail-page__topbar">
      <v-breadcrumbs :items="[{ title: 'Base de Conhecimento', to: '/knowledge-base' }, { title: 'Detalhe do item' }]" />
      <v-btn variant="text" prepend-icon="$prev" to="/knowledge-base">Voltar para Base de Conhecimento</v-btn>
    </div>

    <v-alert v-if="successMessage" type="success" variant="tonal" closable @click:close="successMessage = ''">{{ successMessage }}</v-alert>
    <v-alert v-if="store.error" type="error" variant="tonal">{{ store.error || 'Nao foi possivel concluir a acao.' }}</v-alert>

    <v-empty-state v-else-if="isNotFound" headline="Item de conhecimento nao encontrado" text="Ele pode ter sido removido, arquivado ou nao pertencer a organizacao atual.">
      <template #actions>
        <v-btn color="teal" variant="flat" @click="router.push('/knowledge-base')">Voltar para listagem</v-btn>
      </template>
    </v-empty-state>

    <template v-else>
      <div class="knowledge-detail-page__actions">
        <v-btn color="teal" variant="tonal" prepend-icon="$file" :disabled="isArchived" @click="openEdit">Editar</v-btn>
        <v-btn
          v-if="store.selectedItem?.status === 'draft'"
          color="teal"
          variant="flat"
          prepend-icon="$success"
          @click="askAction('publish')"
        >Publicar</v-btn>
        <v-btn
          v-if="store.selectedItem?.status === 'published'"
          color="warning"
          variant="tonal"
          prepend-icon="$warning"
          @click="askAction('deprecate')"
        >Marcar como obsoleto</v-btn>
        <v-btn
          v-if="['draft', 'published', 'deprecated'].includes(store.selectedItem?.status ?? '')"
          color="grey"
          variant="tonal"
          prepend-icon="$prev"
          @click="askAction('archive')"
        >Arquivar</v-btn>
      </div>

      <v-alert v-if="isArchived" type="info" variant="tonal">Este item esta arquivado e nao pode ser editado.</v-alert>

      <KnowledgeDetailsPanel :item="store.selectedItem" :loading="store.isLoading" />

      <v-dialog v-model="showEdit" max-width="760">
        <v-card>
          <v-card-title>Editar item de conhecimento</v-card-title>
          <v-card-text>
            <KnowledgeItemForm mode="edit" :status="store.selectedItem?.status" :model-value="store.selectedItem" :loading="store.isSaving" @submit="saveEdit" @cancel="showEdit = false" />
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showConfirm" max-width="540">
        <v-card>
          <v-card-title>{{ confirmTitle }}</v-card-title>
          <v-card-text>{{ confirmText }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showConfirm = false">Cancelar</v-btn>
            <v-btn color="teal" variant="flat" :loading="store.isSaving" @click="confirmAction">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </main>
</template>

<style scoped>
.knowledge-detail-page { display: grid; gap: 1rem; }
.knowledge-detail-page__topbar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.knowledge-detail-page__actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
</style>
