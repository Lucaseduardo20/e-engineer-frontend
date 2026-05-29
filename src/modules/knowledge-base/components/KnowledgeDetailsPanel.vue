<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemDetail,
} from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{
  item: KnowledgeItemDetail | null
  loading?: boolean
}>()

const emit = defineEmits<{
  publish: []
  archive: []
  edit: []
}>()

const content = computed(() =>
  props.item?.content ? JSON.stringify(props.item.content, null, 2) : 'Sem conteudo especifico.',
)
</script>

<template>
  <v-progress-linear v-if="loading" indeterminate color="teal" />
  <v-empty-state v-else-if="!item" headline="Item nao encontrado" />
  <section v-else class="knowledge-detail">
    <div class="knowledge-detail__header">
      <div>
        <v-chip color="teal" variant="tonal">{{ knowledgeTypeLabels[item.type] }}</v-chip>
        <v-chip class="ml-2" color="blue-grey" variant="tonal">
          {{ knowledgeStatusLabels[item.status] }}
        </v-chip>
        <h1>{{ item.title }}</h1>
        <p>{{ item.description || 'Sem descricao registrada.' }}</p>
      </div>
      <div class="knowledge-detail__actions">
        <v-btn color="teal" variant="tonal" prepend-icon="$file" @click="emit('edit')">
          Editar
        </v-btn>
        <v-btn
          v-if="item.status === 'draft'"
          color="teal"
          variant="flat"
          prepend-icon="$success"
          @click="emit('publish')"
        >
          Publicar
        </v-btn>
        <v-btn
          v-if="item.status !== 'archived'"
          color="warning"
          variant="tonal"
          prepend-icon="$prev"
          @click="emit('archive')"
        >
          Arquivar
        </v-btn>
      </div>
    </div>

    <div class="knowledge-detail__tags">
      <v-chip v-for="tag in item.tags" :key="tag" size="small" variant="tonal">{{ tag }}</v-chip>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-sheet class="knowledge-detail__section">
          <h2>Conteudo</h2>
          <pre>{{ content }}</pre>
        </v-sheet>
      </v-col>
      <v-col cols="12" md="5">
        <v-sheet class="knowledge-detail__section">
          <h2>Rastreabilidade</h2>
          <p>Criado por {{ item.createdBy }}</p>
          <p>Atualizado por {{ item.updatedBy }}</p>
          <p>Ultima atualizacao {{ formatDateTime(item.updatedAt) }}</p>
          <p v-if="item.publishedAt">Publicado {{ formatDateTime(item.publishedAt) }}</p>
          <p v-if="item.archivedAt">Arquivado {{ formatDateTime(item.archivedAt) }}</p>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Relacionamentos</h2>
          <v-list v-if="item.relations.length" density="compact">
            <v-list-item
              v-for="relation in item.relations"
              :key="relation.id"
              :title="`${relation.relationType} · ${relation.targetType}`"
              :subtitle="relation.targetId"
            />
          </v-list>
          <p v-else>Nenhum relacionamento registrado.</p>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Anexos</h2>
          <v-list v-if="item.attachments.length" density="compact">
            <v-list-item
              v-for="attachment in item.attachments"
              :key="attachment.id"
              :title="attachment.label"
              :subtitle="attachment.fileId"
            />
          </v-list>
          <p v-else>Nenhum anexo vinculado.</p>
        </v-sheet>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.knowledge-detail__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.knowledge-detail h1 {
  margin: 0.75rem 0 0.35rem;
  color: #15231f;
  font-size: 1.8rem;
}

.knowledge-detail p {
  color: #53625d;
}

.knowledge-detail__actions,
.knowledge-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.knowledge-detail__section {
  border: 1px solid #d7e4df;
  border-radius: 0.5rem;
  padding: 1rem;
}

.knowledge-detail__section h2 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

pre {
  overflow: auto;
  white-space: pre-wrap;
  color: #20302b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
}
</style>
