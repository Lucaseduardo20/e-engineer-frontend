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

const statusColor = computed(() => {
  if (props.item.status === 'published') return 'green'
  if (props.item.status === 'draft') return 'blue-grey'
  if (props.item.status === 'deprecated') return 'amber'
  return 'grey'
})
</script>

<template>
  <v-card class="knowledge-card" variant="flat">
    <v-card-text>
      <div class="knowledge-card__top">
        <v-avatar color="teal" variant="tonal" size="36">
          <v-icon icon="$command" size="18" />
        </v-avatar>
        <div>
          <v-chip size="small" color="teal" variant="tonal">{{ typeLabel }}</v-chip>
          <v-chip class="ml-2" size="small" :color="statusColor" variant="tonal">
            {{ statusLabel }}
          </v-chip>
        </div>
      </div>

      <h3>{{ item.title }}</h3>
      <p>{{ item.description || 'Sem descricao registrada.' }}</p>

      <v-alert
        v-if="item.status === 'deprecated'"
        type="warning"
        density="compact"
        variant="tonal"
        class="my-2"
      >
        Item obsoleto para novos projetos.
      </v-alert>

      <div class="knowledge-card__tags">
        <v-chip v-for="tag in item.tags" :key="tag" size="x-small" variant="tonal">
          {{ tag }}
        </v-chip>
      </div>

      <div class="knowledge-card__footer">
        <span>{{ formatDateTime(item.updatedAt) }}</span>
        <v-btn
          :to="`/knowledge-base/${item.id}`"
          color="teal"
          variant="tonal"
          size="small"
          prepend-icon="$next"
        >
          Detalhes
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.knowledge-card {
  height: 100%;
  border: 1px solid #d7e4df;
  border-radius: 0.5rem;
}

.knowledge-card__top,
.knowledge-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

h3 {
  margin: 1rem 0 0.35rem;
  color: #17231f;
  font-size: 1rem;
}

p {
  min-height: 2.8rem;
  color: #53625d;
  font-size: 0.875rem;
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
</style>
