<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import KnowledgeItemTypeContent from '@/modules/knowledge-base/components/detail/KnowledgeItemTypeContent.vue'
import KnowledgeItemGenericContent from '@/modules/knowledge-base/components/detail/KnowledgeItemGenericContent.vue'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemDetail,
} from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{
  item: KnowledgeItemDetail | null
  loading?: boolean
}>()

const typeGuidance = computed(() => {
  if (!props.item) return ''

  if (props.item.type === 'technical_standard') {
    return 'Este padrao orienta como a organizacao deve executar ou validar uma pratica tecnica.'
  }

  if (props.item.type === 'document_model') {
    return 'Este item serve como referencia para criacao de documentos tecnicos semelhantes.'
  }

  if (props.item.type === 'project_reference') {
    return 'Este projeto pode ser usado como base ou inspiracao para novos projetos semelhantes.'
  }

  if (props.item.type === 'lesson_learned') {
    return 'Este aprendizado registra um problema, decisao ou retrabalho que deve orientar projetos futuros.'
  }

  if (props.item.type === 'review_checklist') {
    return 'Use este checklist para revisar entregaveis antes de aprovar ou enviar.'
  }

  return 'Este padrao define como organizar e entregar um pacote tecnico.'
})

const hasContextualType = computed(() =>
  ['project_reference', 'document_model', 'lesson_learned', 'technical_standard', 'review_checklist', 'delivery_standard']
    .includes(props.item?.type ?? ''),
)
function relationLabel(value: string) {
  const labels: Record<string, string> = {
    project: 'Projeto',
    document: 'Documento',
    document_version: 'Versao de documento',
    deliverable: 'Entregavel',
    review: 'Revisao',
    template: 'Template',
  }
  return labels[value] ?? value
}
function relationTo(targetType: string, targetId: string) {
  if (targetType === 'project') return `/projects/${targetId}`
  if (targetType === 'document') return `/documents?documentId=${targetId}`
  if (targetType === 'document_version') return `/documents?documentVersionId=${targetId}`
  if (targetType === 'deliverable') return `/projects?deliverableId=${targetId}`
  if (targetType === 'review') return `/reviews/${targetId}`
  return null
}
</script>

<template>
  <v-progress-linear v-if="loading" indeterminate color="teal" />

  <section v-else-if="item" class="knowledge-detail">
    <div class="knowledge-detail__header">
      <div>
        <div class="knowledge-detail__chips">
          <v-chip color="teal" variant="tonal">{{ knowledgeTypeLabels[item.type] }}</v-chip>
          <v-chip class="ml-2" color="blue-grey" variant="tonal">
            {{ knowledgeStatusLabels[item.status] }}
          </v-chip>
        </div>
        <h1>{{ item.title }}</h1>
        <p class="knowledge-detail__subtitle">
          {{ item.description || 'Sem descricao registrada.' }}
        </p>
        <v-alert type="info" variant="tonal" density="comfortable" class="mt-3">
          {{ typeGuidance }}
        </v-alert>
      </div>
    </div>

    <v-alert
      v-if="item.status === 'archived'"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Este item esta arquivado e nao aparece nas buscas principais por padrao.
    </v-alert>

    <v-alert
      v-if="item.status === 'deprecated'"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Este item esta obsoleto e nao e recomendado para novos projetos. Ele permanece disponivel apenas como historico.
    </v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <KnowledgeItemTypeContent v-if="hasContextualType" :item="item" />
        <KnowledgeItemGenericContent v-else :content="item.content" />
      </v-col>

      <v-col cols="12" md="4">
        <v-sheet class="knowledge-detail__section">
          <h2>Tags e contexto</h2>
          <p class="muted">Tags ajudam a encontrar e recomendar este conhecimento em novos projetos.</p>
          <div class="knowledge-detail__tags">
            <v-chip v-for="tag in item.tags" :key="tag" size="small" variant="tonal">{{ tag }}</v-chip>
          </div>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Relacoes</h2>
          <v-list v-if="item.relations.length" density="compact">
            <v-list-item v-for="relation in item.relations" :key="relation.id">
              <v-list-item-title>
                {{ relation.relationType }} · {{ relationLabel(relation.targetType) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <template v-if="relationTo(relation.targetType, relation.targetId)">
                  <v-btn
                    :to="relationTo(relation.targetType, relation.targetId)!"
                    variant="text"
                    size="small"
                    color="teal"
                    class="pa-0"
                  >
                    {{ relation.targetId }}
                  </v-btn>
                </template>
                <template v-else>{{ relation.targetId }}</template>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <template v-else>
            <p class="muted">Projetos relacionados</p>
            <p class="placeholder">Ainda nenhum projeto vinculado a este item.</p>
            <p class="muted mt-2">Documentos relacionados</p>
            <p class="placeholder">Ainda nenhum documento vinculado a este item.</p>
            <p class="muted mt-2">Revisoes relacionadas</p>
            <p class="placeholder">Ainda nenhuma revisao vinculada a este item.</p>
          </template>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Historico</h2>
          <p>Criado por {{ item.createdBy }}</p>
          <p>Criado em {{ formatDateTime(item.createdAt) }}</p>
          <p>Atualizado em {{ formatDateTime(item.updatedAt) }}</p>
          <p v-if="item.publishedAt">Publicado em {{ formatDateTime(item.publishedAt) }}</p>
          <p v-if="item.archivedAt">Arquivado em {{ formatDateTime(item.archivedAt) }}</p>
          <p v-if="item.deprecatedAt">Marcado como obsoleto em {{ formatDateTime(item.deprecatedAt) }}</p>
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

.knowledge-detail__subtitle {
  color: #53625d;
}

.knowledge-detail__chips,
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

.knowledge-detail__content-block + .knowledge-detail__content-block {
  margin-top: 1rem;
}

.muted {
  color: #64736f;
  font-size: 0.85rem;
}

.placeholder {
  color: #53625d;
  font-size: 0.9rem;
}

.metadata-key {
  width: 35%;
  color: #42524d;
  font-weight: 600;
}
</style>
