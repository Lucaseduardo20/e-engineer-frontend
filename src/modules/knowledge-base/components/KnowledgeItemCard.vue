<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import type { KnowledgeItem } from '@/modules/knowledge-base/types/knowledge.types'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
} from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{
  item: KnowledgeItem
}>()

const typeLabel = computed(() => knowledgeTypeLabels[props.item.type])
const statusLabel = computed(() => knowledgeStatusLabels[props.item.status])
const statusMeta = computed(() => {
  if (props.item.status === 'published') {
    return { color: 'green', icon: '$success', hint: 'Conhecimento oficial' }
  }
  if (props.item.status === 'draft') {
    return { color: 'blue-grey', icon: '$edit', hint: 'Ainda nao publicado' }
  }
  if (props.item.status === 'deprecated') {
    return { color: 'amber', icon: '$error', hint: 'Obsoleto / nao recomendado' }
  }
  return { color: 'grey', icon: '$calendar', hint: 'Arquivado' }
})

const typeIcon = computed(() => {
  const map = {
    technical_standard: '$command',
    document_model: '$file',
    project_reference: '$calendar',
    lesson_learned: '$warning',
    review_checklist: '$complete',
    delivery_standard: '$next',
    zoning_rule_reference: '$search',
    project_template: '$plus',
  } as const

  return map[props.item.type] ?? '$command'
})

const visibleTags = computed(() => props.item.tags.slice(0, 4))
const extraTagsCount = computed(() => Math.max(0, props.item.tags.length - visibleTags.value.length))
const shortDescription = computed(() => props.item.description || 'Sem descricao cadastrada.')
const creatorLabel = computed(() => props.item.creatorName || props.item.createdBy || 'Autor nao informado')
</script>

<template>
  <v-card class="knowledge-card" variant="flat" :to="`/knowledge-base/${item.id}`" hover>
    <v-card-text>
      <div class="knowledge-card__top">
        <v-avatar color="teal" variant="tonal" size="40">
          <v-icon :icon="typeIcon" size="20" />
        </v-avatar>
        <div class="knowledge-card__header-meta">
          <v-chip size="small" color="teal" variant="tonal">{{ typeLabel }}</v-chip>
          <v-chip class="ml-2" size="small" :color="statusMeta.color" variant="tonal" :prepend-icon="statusMeta.icon">
            {{ statusLabel }}
          </v-chip>
        </div>
      </div>

      <h3>{{ item.title }}</h3>
      <p class="knowledge-card__description">{{ shortDescription }}</p>

      <v-alert
        v-if="item.status === 'deprecated'"
        type="warning"
        density="compact"
        variant="tonal"
        class="my-2"
      >
        Item obsoleto para novos projetos.
      </v-alert>
      <v-alert
        v-else-if="item.status === 'archived'"
        type="info"
        density="compact"
        variant="tonal"
        class="my-2"
      >
        Item arquivado para historico.
      </v-alert>

      <div class="knowledge-card__tags">
        <v-chip v-for="tag in visibleTags" :key="tag" size="x-small" variant="tonal">
          {{ tag }}
        </v-chip>
        <v-chip v-if="extraTagsCount" size="x-small" variant="outlined">+{{ extraTagsCount }}</v-chip>
      </div>

      <div class="knowledge-card__context">
        <span class="knowledge-card__hint">{{ statusMeta.hint }}</span>
        <span v-if="item.relationsCount !== undefined" class="knowledge-card__hint">
          {{ item.relationsCount }} relacoes
        </span>
      </div>

      <div class="knowledge-card__footer">
        <div>
          <div class="knowledge-card__meta-title">Atualizado em {{ formatDateTime(item.updatedAt) }}</div>
          <div class="knowledge-card__meta-sub">Criado por {{ creatorLabel }}</div>
        </div>
        <v-btn
          color="teal"
          variant="tonal"
          size="small"
          prepend-icon="$next"
          @click.stop="$router.push(`/knowledge-base/${item.id}`)"
        >
          Abrir detalhe
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.knowledge-card {
  height: 100%;
  border: 1px solid #d7e4df;
  border-radius: 0.75rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.knowledge-card:hover {
  border-color: #b8d5cc;
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgb(15 45 38 / 0.08);
}

.knowledge-card__top,
.knowledge-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.knowledge-card__header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

h3 {
  margin: 1rem 0 0.35rem;
  color: #17231f;
  font-size: 1rem;
}

.knowledge-card__description {
  min-height: 2.8rem;
  color: #53625d;
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-card__tags {
  display: flex;
  min-height: 1.5rem;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.75rem 0;
}

.knowledge-card__footer span {
  color: #64736f;
  font-size: 0.78rem;
}

.knowledge-card__context {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.knowledge-card__hint {
  color: #52635d;
  font-size: 0.78rem;
}

.knowledge-card__meta-title {
  color: #3e4e49;
  font-size: 0.8rem;
}

.knowledge-card__meta-sub {
  color: #72817d;
  font-size: 0.74rem;
}
</style>
