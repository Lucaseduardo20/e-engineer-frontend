<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import KnowledgeItemForm from '@/modules/knowledge-base/components/KnowledgeItemForm.vue'
import KnowledgeItemsList from '@/modules/knowledge-base/components/KnowledgeItemsList.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import type { CreateKnowledgeItemDto } from '@/modules/knowledge-base/types/knowledge.types'

const route = useRoute()
const router = useRouter()
const store = useKnowledgeItemsStore()
const auth = useAuthStore()
const isFormOpen = ref(route.query.new === '1')
const successMessage = ref('')

const dialogTitle = computed(() => 'Criar item de conhecimento')

watch(
  () => route.query.new,
  (value) => {
    isFormOpen.value = value === '1'
  },
)

async function create(payload: CreateKnowledgeItemDto) {
  const item = await store.createItem(payload)

  if (item) {
    successMessage.value = 'Item de conhecimento criado como rascunho.'
    isFormOpen.value = false
    await store.listItems(1)
    await router.replace('/knowledge-base')
  }
}

function closeForm() {
  isFormOpen.value = false
  void router.replace('/knowledge-base')
}
</script>

<template>
  <main class="knowledge-page">
    <div class="knowledge-page__header">
      <div>
        <h1>Base de Conhecimento</h1>
        <p>Acervo tecnico reutilizavel com padroes, modelos, referencias e licoes aprendidas.</p>
      </div>
      <v-btn
        v-if="auth.can('knowledge.create')"
        color="teal"
        prepend-icon="$success"
        @click="isFormOpen = true"
      >
        Novo item
      </v-btn>
    </div>

    <v-alert v-if="successMessage" type="success" variant="tonal" closable @click:close="successMessage = ''">
      {{ successMessage }}
    </v-alert>

    <KnowledgeItemsList />

    <v-dialog v-model="isFormOpen" max-width="760" scrollable>
      <v-card class="knowledge-page__dialog">
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <KnowledgeItemForm :loading="store.isSaving" @submit="create" @cancel="closeForm" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.knowledge-page {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.knowledge-page__header {
  display: grid;
  gap: 1rem;
}

h1 {
  margin: 0;
  color: #15231f;
  font-size: clamp(1.55rem, 6vw, 2rem);
  line-height: 1.1;
}

p {
  max-width: 58rem;
  margin: 0.5rem 0 0;
  color: #596963;
  line-height: 1.45;
}

.knowledge-page__dialog {
  max-height: calc(100dvh - 2rem);
}

@media (min-width: 720px) {
  .knowledge-page {
    gap: 1.25rem;
  }

  .knowledge-page__header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }
}
</style>
