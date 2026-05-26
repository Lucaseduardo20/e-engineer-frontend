<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    label?: string
  }>(),
  {
    label: 'registros',
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const firstItem = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const lastItem = computed(() => Math.min(props.total, props.page * props.pageSize))
</script>

<template>
  <div class="base-pagination" role="navigation" aria-label="Paginacao">
    <div class="base-pagination__summary">
      <strong>{{ firstItem }}-{{ lastItem }}</strong>
      <span>de {{ total }} {{ label }}</span>
    </div>

    <v-pagination
      :model-value="page"
      :length="pageCount"
      density="comfortable"
      rounded="lg"
      active-color="teal"
      total-visible="5"
      @update:model-value="emit('update:page', Number($event))"
    />
  </div>
</template>

<style scoped>
.base-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid #d8e1de;
  background: #f8fbfa;
  padding: 0.75rem 1rem;
}

.base-pagination__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: #51615d;
  font-size: 0.875rem;
}

.base-pagination__summary strong {
  color: #123c32;
}

@media (max-width: 720px) {
  .base-pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
