<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import KnowledgeDetailsPanel from '@/modules/knowledge-base/components/KnowledgeDetailsPanel.vue'
import KnowledgeItemForm from '@/modules/knowledge-base/components/KnowledgeItemForm.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import type { CreateKnowledgeItemDto } from '@/modules/knowledge-base/types/knowledge.types'

const route = useRoute()
const store = useKnowledgeItemsStore()
const isEditing = ref(false)

onMounted(() => {
  void store.getItemDetail(String(route.params.id))
})

async function publish() {
  await store.publishItem(String(route.params.id))
}

async function archive() {
  await store.archiveItem(String(route.params.id))
}

async function update(payload: CreateKnowledgeItemDto) {
  const updated = await store.updateItem(String(route.params.id), payload)

  if (updated) {
    isEditing.value = false
  }
}
</script>

<template>
  <main class="knowledge-detail-page">
    <v-alert v-if="store.error" type="error" variant="tonal">{{ store.error }}</v-alert>
    <KnowledgeDetailsPanel
      :item="store.selectedItem"
      :loading="store.isLoading"
      @publish="publish"
      @archive="archive"
      @edit="isEditing = true"
    />

    <v-dialog v-model="isEditing" max-width="760">
      <v-card>
        <v-card-title>Editar conhecimento</v-card-title>
        <v-card-text>
          <KnowledgeItemForm
            :model-value="store.selectedItem"
            :loading="store.isSaving"
            @submit="update"
            @cancel="isEditing = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.knowledge-detail-page {
  display: grid;
  gap: 1rem;
}
</style>
