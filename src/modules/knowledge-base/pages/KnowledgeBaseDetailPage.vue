<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KnowledgeDetailsPanel from '@/modules/knowledge-base/components/KnowledgeDetailsPanel.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'

const route = useRoute()
const router = useRouter()
const store = useKnowledgeItemsStore()

const itemId = computed(() => String(route.params.id))

onMounted(() => {
  void store.getItemDetail(itemId.value)
})

const isNotFound = computed(() => !store.isLoading && !store.selectedItem && !store.error)
</script>

<template>
  <main class="knowledge-detail-page">
    <div class="knowledge-detail-page__topbar">
      <v-breadcrumbs :items="[{ title: 'Base de Conhecimento', to: '/knowledge-base' }, { title: 'Detalhe do item' }]" />
      <v-btn variant="text" prepend-icon="$prev" to="/knowledge-base">Voltar para Base de Conhecimento</v-btn>
    </div>

    <v-alert v-if="store.error" type="error" variant="tonal">
      Nao foi possivel carregar o item de conhecimento.
    </v-alert>

    <v-empty-state
      v-else-if="isNotFound"
      headline="Item de conhecimento nao encontrado"
      text="Ele pode ter sido removido, arquivado ou nao pertencer a organizacao atual."
    >
      <template #actions>
        <v-btn color="teal" variant="flat" @click="router.push('/knowledge-base')">Voltar para listagem</v-btn>
      </template>
    </v-empty-state>

    <KnowledgeDetailsPanel v-else :item="store.selectedItem" :loading="store.isLoading" />
  </main>
</template>

<style scoped>
.knowledge-detail-page {
  display: grid;
  gap: 1rem;
}

.knowledge-detail-page__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
</style>
