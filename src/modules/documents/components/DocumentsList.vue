<script setup lang="ts">
import BasePagination from '@/shared/components/BasePagination.vue'
import DocumentCard from '@/modules/documents/components/DocumentCard.vue'
import type { DocumentSummary, User } from '@/shared/types/api-contracts'

withDefaults(
  defineProps<{
    documents: DocumentSummary[]
    loading?: boolean
    page?: number
    pageSize?: number
    total?: number
    users?: User[]
  }>(),
  {
    page: 1,
    pageSize: 20,
    total: 0,
    users: () => [],
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  upload: [document: DocumentSummary]
  edit: [document: DocumentSummary]
  assign: [document: DocumentSummary]
  history: [document: DocumentSummary]
  delete: [document: DocumentSummary]
}>()
</script>

<template>
  <v-card class="documents-list" variant="flat" rounded="lg">
    <v-card-title class="documents-list__title">
      <div>
        <div class="documents-list__eyebrow">Acervo tecnico</div>
        <span>Documentos e versoes</span>
      </div>
      <v-chip size="small" color="teal" variant="tonal">
        <v-icon icon="$file" start size="14" />
        {{ total || documents.length }}
      </v-chip>
    </v-card-title>

    <div v-if="loading" class="documents-list__grid">
      <v-skeleton-loader v-for="item in 6" :key="item" type="card" />
    </div>

    <v-empty-state
      v-else-if="documents.length === 0"
      headline="Nenhum documento tecnico"
      text="Cadastre um documento e envie a primeira versao para iniciar o controle de revisoes."
    />

    <div v-else class="documents-list__grid">
      <DocumentCard
        v-for="document in documents"
        :key="document.id"
        :document="document"
        :users="users"
        @upload="emit('upload', $event)"
        @edit="emit('edit', $event)"
        @assign="emit('assign', $event)"
        @history="emit('history', $event)"
        @delete="emit('delete', $event)"
      />
    </div>

    <BasePagination
      :page="page"
      :page-size="pageSize"
      :total="total || documents.length"
      label="documentos"
      @update:page="emit('update:page', $event)"
    />
  </v-card>
</template>

<style scoped>
.documents-list {
  overflow: hidden;
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.documents-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d8e1de;
  padding: 1rem 1.125rem;
}

.documents-list__eyebrow {
  color: #65736f;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.documents-list__grid {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  padding: 1rem;
}
</style>
